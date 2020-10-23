const { put } = require('../../dynamodbClientService');

/**
 * createCaseDeadlineCatalogRecord
 *
 * @param {object} providers the providers object
 * @param {object} providers.applicationContext the application context
 * @param {string} providers.caseDeadlineId the id of the case deadline to create catalog record for
 */
exports.createCaseDeadlineCatalogRecord = async ({
  applicationContext,
  caseDeadlineId,
  deadlineDate,
}) => {
  await put({
    Item: {
      caseDeadlineId,
      gsi1pk: 'case-deadline-catalog',
      pk: deadlineDate,
      sk: `case-deadline-catalog|${caseDeadlineId}`,
    },
    applicationContext,
  });
};
