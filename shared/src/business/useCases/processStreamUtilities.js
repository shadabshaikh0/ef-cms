const AWS = require('aws-sdk');
const {
  OPINION_EVENT_CODES_WITH_BENCH_OPINION,
  ORDER_EVENT_CODES,
} = require('../entities/EntityConstants');
const { compact, flattenDeep, partition } = require('lodash');

const partitionRecords = records => {
  const [removeRecords, insertModifyRecords] = partition(
    records,
    record => record.eventName === 'REMOVE',
  );

  const [docketEntryRecords, nonDocketEntryRecords] = partition(
    insertModifyRecords,
    record =>
      record.dynamodb.NewImage.entityName &&
      record.dynamodb.NewImage.entityName.S === 'DocketEntry',
  );

  const [caseEntityRecords, nonCaseEntityRecords] = partition(
    nonDocketEntryRecords,
    record =>
      record.dynamodb.NewImage.entityName &&
      record.dynamodb.NewImage.entityName.S === 'Case',
  );

  const [workItemRecords, nonWorkItemRecords] = partition(
    nonCaseEntityRecords,
    record =>
      record.dynamodb.NewImage.entityName &&
      record.dynamodb.NewImage.entityName.S === 'WorkItem',
  );

  const [practitionerMappingRecords, nonPractitionerMappingRecords] = partition(
    nonWorkItemRecords,
    record =>
      record.dynamodb.NewImage.entityName &&
      record.dynamodb.NewImage.entityName.S === 'PrivatePractitioner' &&
      record.dynamodb.NewImage.pk.S.startsWith('case|') &&
      record.dynamodb.NewImage.sk.S.startsWith('privatePractitioner|'),
  );

  const [messageRecords, otherRecords] = partition(
    nonPractitionerMappingRecords,
    record =>
      record.dynamodb.NewImage.entityName &&
      record.dynamodb.NewImage.entityName.S === 'Message',
  );

  return {
    caseEntityRecords,
    docketEntryRecords,
    messageRecords,
    otherRecords,
    practitionerMappingRecords,
    removeRecords,
    workItemRecords,
  };
};

/**
 * fetches the latest version of the case from dynamodb and re-indexes all of the docket-entries associated with the case.
 *
 * @param {array} caseEntityRecords all of the event stream records associated with case entities
 */
const processCaseEntries = async ({
  applicationContext,
  caseEntityRecords,
  utils,
}) => {
  if (!caseEntityRecords.length) return;

  const indexCaseEntry = async caseRecord => {
    const caseNewImage = caseRecord.dynamodb.NewImage;
    const caseRecords = [];

    const caseMetadataWithCounsel = await utils.getCaseMetadataWithCounsel({
      applicationContext,
      docketNumber: caseNewImage.docketNumber.S,
    });

    const marshalledCase = AWS.DynamoDB.Converter.marshall(
      caseMetadataWithCounsel,
    );

    caseRecords.push({
      dynamodb: {
        Keys: {
          pk: {
            S: caseNewImage.pk.S,
          },
          sk: {
            S: `${caseNewImage.sk.S}`,
          },
        },
        NewImage: {
          ...marshalledCase,
          case_relations: { name: 'case' },
          entityName: { S: 'CaseDocketEntryMapping' },
        }, // Create a mapping record on the docket-entry index for parent-child relationships
      },
      eventName: 'MODIFY',
    });

    caseRecords.push({
      dynamodb: {
        Keys: {
          pk: {
            S: caseNewImage.pk.S,
          },
          sk: {
            S: caseNewImage.sk.S,
          },
        },
        NewImage: marshalledCase,
      },
      eventName: 'MODIFY',
    });

    return caseRecords;
  };

  const indexRecords = await Promise.all(caseEntityRecords.map(indexCaseEntry));

  const { failedRecords } = await applicationContext
    .getPersistenceGateway()
    .bulkIndexRecords({
      applicationContext,
      records: flattenDeep(indexRecords),
    });

  if (failedRecords.length > 0) {
    applicationContext.logger.error(
      'the case or docket entry records that failed to index',
      { failedRecords },
    );
    throw new Error('failed to index case entry or docket entry records');
  }
};

const processPractitionerMappingEntries = async ({
  applicationContext,
  practitionerMappingEntries,
  utils,
}) => {
  if (!practitionerMappingEntries.length) return;

  const indexCaseEntryForPractitionerMapping =
    async practitionerMappingRecord => {
      const practitionerMappingNewImage =
        practitionerMappingRecord.dynamodb.NewImage;
      const caseRecords = [];

      const caseMetadataWithCounsel = await utils.getCaseMetadataWithCounsel({
        applicationContext,
        docketNumber: practitionerMappingNewImage.pk.S.substring(
          'case|'.length,
        ),
      });

      const marshalledCase = AWS.DynamoDB.Converter.marshall(
        caseMetadataWithCounsel,
      );

      caseRecords.push({
        dynamodb: {
          Keys: {
            pk: {
              S: practitionerMappingNewImage.pk.S,
            },
            sk: {
              S: practitionerMappingNewImage.pk.S,
            },
          },
          NewImage: {
            ...marshalledCase,
            case_relations: { name: 'case' },
            entityName: { S: 'CaseDocketEntryMapping' },
          }, // Create a mapping record on the docket-entry index for parent-child relationships
        },
        eventName: 'MODIFY',
      });

      caseRecords.push({
        dynamodb: {
          Keys: {
            pk: {
              S: practitionerMappingNewImage.pk.S,
            },
            sk: {
              S: practitionerMappingNewImage.sk.S,
            },
          },
          NewImage: marshalledCase,
        },
        eventName: 'MODIFY',
      });

      return caseRecords;
    };

  const indexRecords = await Promise.all(
    practitionerMappingEntries.map(indexCaseEntryForPractitionerMapping),
  );

  const { failedRecords } = await applicationContext
    .getPersistenceGateway()
    .bulkIndexRecords({
      applicationContext,
      records: flattenDeep(indexRecords),
    });

  if (failedRecords.length > 0) {
    applicationContext.logger.error(
      'the practitioner mapping record that failed to index',
      { failedRecords },
    );
    throw new Error('failed to index practitioner mapping records');
  }
};

/**
 * fetches the latest version of the case from dynamodb and re-indexes this docket-entries combined with the latest case info.
 *
 * @param {array} docketEntryRecords all of the event stream records associated with docket entries
 */
const processDocketEntries = async ({
  applicationContext,
  docketEntryRecords: records,
  utils,
}) => {
  if (!records.length) return;

  applicationContext.logger.debug(
    `going to index ${records.length} docketEntryRecords`,
  );

  const newDocketEntryRecords = await Promise.all(
    records.map(async record => {
      // TODO: May need to remove the `case_relations` object and re-add later
      const fullDocketEntry = AWS.DynamoDB.Converter.unmarshall(
        record.dynamodb.NewImage,
      );

      const isSearchable =
        OPINION_EVENT_CODES_WITH_BENCH_OPINION.includes(
          fullDocketEntry.eventCode,
        ) || ORDER_EVENT_CODES.includes(fullDocketEntry.eventCode);

      if (isSearchable && fullDocketEntry.documentContentsId) {
        // TODO: for performance, we should not re-index doc contents if we do not have to (use a contents hash?)
        try {
          const buffer = await utils.getDocument({
            applicationContext,
            documentContentsId: fullDocketEntry.documentContentsId,
          });
          const { documentContents } = JSON.parse(buffer.toString());

          fullDocketEntry.documentContents = documentContents;
        } catch (err) {
          applicationContext.logger.error(
            `the s3 document of ${fullDocketEntry.documentContentsId} was not found in s3`,
            { err },
          );
        }
      }

      const caseDocketEntryMappingRecordId = `${fullDocketEntry.pk}_${fullDocketEntry.pk}|mapping`;

      return {
        dynamodb: {
          Keys: {
            pk: {
              S: fullDocketEntry.pk,
            },
            sk: {
              S: fullDocketEntry.sk,
            },
          },
          NewImage: {
            ...AWS.DynamoDB.Converter.marshall(fullDocketEntry),
            case_relations: {
              name: 'document',
              parent: caseDocketEntryMappingRecordId,
            },
          },
        },
        eventName: 'MODIFY',
      };
    }),
  );

  const { failedRecords } = await applicationContext
    .getPersistenceGateway()
    .bulkIndexRecords({
      applicationContext,
      records: newDocketEntryRecords,
    });

  if (failedRecords.length > 0) {
    applicationContext.logger.error(
      'the docket entry records that failed to index',
      { failedRecords },
    );
    throw new Error('failed to index docket entry records');
  }
};

const processEntries = async ({ applicationContext, records, recordType }) => {
  if (!records.length) return;

  applicationContext.logger.debug(
    `going to index ${records.length} ${recordType}`,
  );

  const { failedRecords } = await applicationContext
    .getPersistenceGateway()
    .bulkIndexRecords({
      applicationContext,
      records,
    });

  if (failedRecords.length > 0) {
    applicationContext.logger.error('the records that failed to index', {
      failedRecords,
    });
    throw new Error('failed to index records');
  }
};

const processWorkItemEntries = ({ applicationContext, workItemRecords }) =>
  processEntries({
    applicationContext,
    recordType: 'workItemRecords',
    records: workItemRecords,
  });

const processMessageEntries = async ({
  applicationContext,
  messageRecords,
  utils,
}) => {
  if (!messageRecords.length) return;

  applicationContext.logger.debug(
    `going to index ${messageRecords.length} message records`,
  );

  const indexMessageEntry = async messageRecord => {
    const messageNewImage = messageRecord.dynamodb.NewImage;

    // go get the latest message if we're indexing a message with isRepliedTo set to false - it might
    // have been updated in dynamo since this record was created to be processed
    if (!messageNewImage.isRepliedTo.BOOL) {
      const latestMessageData = await utils.getMessage({
        applicationContext,
        docketNumber: messageNewImage.docketNumber.S,
        messageId: messageNewImage.messageId.S,
      });

      if (!latestMessageData.isRepliedTo) {
        const marshalledMessage =
          AWS.DynamoDB.Converter.marshall(latestMessageData);

        return {
          dynamodb: {
            Keys: {
              pk: {
                S: messageNewImage.pk.S,
              },
              sk: {
                S: messageNewImage.sk.S,
              },
            },
            NewImage: marshalledMessage,
          },
          eventName: 'MODIFY',
        };
      }
    } else {
      return messageRecord;
    }
  };

  const indexRecords = await Promise.all(messageRecords.map(indexMessageEntry));

  const { failedRecords } = await applicationContext
    .getPersistenceGateway()
    .bulkIndexRecords({
      applicationContext,
      records: compact(indexRecords),
    });

  if (failedRecords.length > 0) {
    applicationContext.logger.error('the records that failed to index', {
      failedRecords,
    });
    throw new Error('failed to index message records');
  }
};

// processPractitionerMappingEntries?
// if pk is case| and sk is privatePractitioner| (or irsPractitioner|?) && entity name is PrivatePractitioner (OR IrsPractitioner?)
//     get case metadata with counsel
//     marshall case
//     create modify record for case with added practitioner

const processOtherEntries = ({ applicationContext, otherRecords }) =>
  processEntries({
    applicationContext,
    recordType: 'otherRecords',
    records: otherRecords,
  });

const processRemoveEntries = async ({ applicationContext, removeRecords }) => {
  if (!removeRecords.length) return;

  applicationContext.logger.debug(
    `going to index ${removeRecords.length} removeRecords`,
  );

  const { failedRecords } = await applicationContext
    .getPersistenceGateway()
    .bulkDeleteRecords({
      applicationContext,
      records: removeRecords,
    });

  if (failedRecords.length > 0) {
    applicationContext.logger.error('the records that failed to delete', {
      failedRecords,
    });
    throw new Error('failed to delete records');
  }
};

exports.partitionRecords = partitionRecords;
exports.processCaseEntries = processCaseEntries;
exports.processPractitionerMappingEntries = processPractitionerMappingEntries;
exports.processDocketEntries = processDocketEntries;
exports.processMessageEntries = processMessageEntries;
exports.processOtherEntries = processOtherEntries;
exports.processRemoveEntries = processRemoveEntries;
exports.processWorkItemEntries = processWorkItemEntries;
