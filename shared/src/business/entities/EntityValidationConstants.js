const joi = require('joi');
const {
  ALL_DOCUMENT_TYPES,
  ALL_EVENT_CODES,
  AUTOGENERATED_EXTERNAL_DOCUMENT_TYPES,
  AUTOGENERATED_INTERNAL_DOCUMENT_TYPES,
  CASE_STATUS_TYPES,
  CHAMBERS_SECTIONS,
  DOCUMENT_PROCESSING_STATUS_OPTIONS,
  DOCUMENT_RELATIONSHIPS,
  EVENT_CODES_REQUIRING_JUDGE_SIGNATURE,
  EVENT_CODES_REQUIRING_SIGNATURE,
  EXTERNAL_DOCUMENT_TYPES,
  INTERNAL_DOCUMENT_TYPES,
  IRS_SYSTEM_SECTION,
  OBJECTIONS_OPTIONS,
  OPINION_DOCUMENT_TYPES,
  ROLES,
  SCENARIOS,
  SECTIONS,
  SERVED_PARTIES_CODES,
} = require('./EntityConstants');
const {
  JoiValidationConstants,
} = require('../../utilities/JoiValidationConstants');

// TODO: when 6217 is done, enable the commented validators

const DOCKET_ENTRY_VALIDATION_RULE_KEYS = {
  action: JoiValidationConstants.STRING.max(100)
    .optional()
    .allow(null)
    .description('Action taken in response to this Docket Record item.'),
  addToCoversheet: joi.boolean().optional(),
  additionalInfo: JoiValidationConstants.STRING.max(500).optional(),
  additionalInfo2: JoiValidationConstants.STRING.max(500).optional(),
  archived: joi
    .boolean()
    .optional()
    .description(
      'A document that was archived instead of added to the Docket Record.',
    ),
  attachments: joi.boolean().optional(),
  certificateOfService: joi.boolean().optional(),
  certificateOfServiceDate: JoiValidationConstants.ISO_DATE.when(
    'certificateOfService',
    {
      is: true,
      otherwise: joi.optional().allow(null),
      then: joi.required(),
    },
  ),
  createdAt: JoiValidationConstants.ISO_DATE.required().description(
    'When the Document was added to the system.',
  ),
  date: JoiValidationConstants.ISO_DATE.optional()
    .allow(null)
    .description(
      'An optional date used when generating a fully concatenated document title.',
    ),
  docketEntryId: JoiValidationConstants.UUID.required().description(
    'System-generated unique ID for the docket entry. If the docket entry is associated with a document in S3, this is also the S3 document key.',
  ),
  docketNumber: JoiValidationConstants.DOCKET_NUMBER.optional().description(
    'Docket Number of the associated Case in XXXXX-YY format.',
  ),
  docketNumbers: JoiValidationConstants.STRING.max(500)
    .optional()
    .description(
      'Optional Docket Number text used when generating a fully concatenated document title.',
    ),
  documentContentsId: JoiValidationConstants.UUID.optional().description(
    'The S3 ID containing the text contents of the document.',
  ),
  documentIdBeforeSignature: JoiValidationConstants.UUID.optional().description(
    'The id for the original document that was uploaded.',
  ),
  documentTitle: JoiValidationConstants.DOCUMENT_TITLE.optional().description(
    'The title of this document.',
  ),
  documentType: JoiValidationConstants.STRING.valid(...ALL_DOCUMENT_TYPES)
    .required()
    .description('The type of this document.'),
  draftOrderState: joi.object().allow(null).optional(),
  editState: JoiValidationConstants.STRING.max(4000)
    .allow(null)
    .optional()
    .meta({ tags: ['Restricted'] })
    .description('JSON representation of the in-progress edit of this item.'),
  entityName: JoiValidationConstants.STRING.valid('DocketEntry').required(),
  eventCode: JoiValidationConstants.STRING.valid(...ALL_EVENT_CODES).required(),
  filedBy: JoiValidationConstants.STRING.max(500)
    .when('documentType', {
      is: JoiValidationConstants.STRING.valid(
        ...EXTERNAL_DOCUMENT_TYPES,
        ...INTERNAL_DOCUMENT_TYPES,
      ),
      otherwise: joi.allow('', null).optional(),
      then: joi.when('documentType', {
        is: JoiValidationConstants.STRING.valid(
          ...AUTOGENERATED_EXTERNAL_DOCUMENT_TYPES,
          ...AUTOGENERATED_INTERNAL_DOCUMENT_TYPES,
        ),
        otherwise: joi.required(),
        then: joi.when('isAutoGenerated', {
          is: false,
          otherwise: joi.allow('', null).optional(),
          then: joi.required(),
        }),
      }),
    })
    .description(
      'The party who filed the document, either the petitioner or respondent on the case.',
    ),
  filingDate: JoiValidationConstants.ISO_DATE.max('now')
    .required()
    .description('Date that this Document was filed.'),
  freeText: JoiValidationConstants.STRING.max(1000).optional(),
  freeText2: JoiValidationConstants.STRING.max(1000).optional(),
  hasOtherFilingParty: joi
    .boolean()
    .optional()
    .description('Whether the document has other filing party.'),
  hasSupportingDocuments: joi.boolean().optional(),
  index: joi
    .number()
    .integer()
    .optional()
    .description('Index of this item in the Docket Record list.'),
  isAutoGenerated: joi
    .boolean()
    .optional()
    .description(
      'A flag that indicates when a document was generated by the system as opposed to being uploaded by a user.',
    ),
  isDraft: joi
    .boolean()
    .required()
    .description('Whether the document is a draft (not on the docket record).'),
  isFileAttached: joi
    .boolean()
    .optional()
    .description('Has an associated PDF in S3.'),
  isLegacy: joi
    .boolean()
    .when('isLegacySealed', {
      is: true,
      otherwise: joi.optional(),
      then: joi.required().valid(true),
    })
    .description(
      'Indicates whether or not the document belongs to a legacy case that has been migrated to the new system.',
    ),
  isLegacySealed: joi
    .boolean()
    .optional()
    .description(
      'Indicates whether or not the legacy document was sealed prior to being migrated to the new system.',
    ),
  isLegacyServed: joi
    .boolean()
    .optional()
    .description(
      'Indicates whether or not the legacy document was served prior to being migrated to the new system.',
    ),
  isMinuteEntry: joi.boolean().required(),
  isOnDocketRecord: joi.boolean().required(),
  isPaper: joi.boolean().optional(),
  isSealed: joi
    .boolean()
    .when('isLegacySealed', {
      is: true,
      otherwise: joi.optional(),
      then: joi.required().valid(true),
    })
    .description('Indicates whether or not the document is sealed.'),
  isStricken: joi
    .boolean()
    .when('isLegacy', {
      is: true,
      otherwise: joi.optional(),
      then: joi.required(),
    })
    .description('Indicates the item has been removed from the docket record.'),
  judge: JoiValidationConstants.STRING.max(100)
    .allow(null)
    .description('The judge associated with the document.')
    .when('documentType', {
      is: JoiValidationConstants.STRING.valid(
        ...OPINION_DOCUMENT_TYPES.map(t => t.documentType),
      ),
      otherwise: joi.optional(),
      then: joi.required(),
    }),
  judgeUserId: JoiValidationConstants.UUID.optional().description(
    'Unique ID for the associated judge.',
  ),
  lodged: joi
    .boolean()
    .optional()
    .description(
      'A lodged document is awaiting action by the judge to enact or refuse.',
    ),
  mailingDate: JoiValidationConstants.STRING.max(100).optional(),
  numberOfPages: joi.number().integer().optional().allow(null),
  objections: JoiValidationConstants.STRING.valid(
    ...OBJECTIONS_OPTIONS,
  ).optional(),
  ordinalValue: JoiValidationConstants.STRING.optional(),
  otherFilingParty: JoiValidationConstants.STRING.max(100)
    .when('hasOtherFilingParty', {
      is: true,
      otherwise: joi.optional(),
      then: joi.required(),
    })
    .description(
      'When someone other than the petitioner or respondent files a document, this is the name of the person who filed that document',
    ),
  partyIrsPractitioner: joi.boolean().optional(),
  partyPrimary: joi
    .boolean()
    .optional()
    .description('Use the primary contact to compose the filedBy text.'),
  partySecondary: joi
    .boolean()
    .optional()
    .description('Use the secondary contact to compose the filedBy text.'),
  pending: joi
    .boolean()
    .optional()
    .description(
      'Determines if the docket entry should be displayed in the Pending Report.',
    ),
  previousDocument: joi
    .object()
    .keys({
      docketEntryId: JoiValidationConstants.UUID.optional().description(
        'The ID of the previous document.',
      ),
      documentTitle: JoiValidationConstants.DOCUMENT_TITLE.optional().description(
        'The title of the previous document.',
      ),
      documentType: JoiValidationConstants.STRING.valid(...ALL_DOCUMENT_TYPES)
        .optional()
        .description('The type of the previous document.'),
    })
    .optional(),
  privatePractitioners: joi // TODO: limit keys
    .array()
    .items({ name: JoiValidationConstants.STRING.max(100).required() })
    .optional()
    .description('Practitioner names to be used to compose the filedBy text.'),
  processingStatus: JoiValidationConstants.STRING.valid(
    ...Object.values(DOCUMENT_PROCESSING_STATUS_OPTIONS),
  ).required(),
  qcAt: JoiValidationConstants.ISO_DATE.optional(),
  qcByUserId: JoiValidationConstants.UUID.optional().allow(null),
  receivedAt: JoiValidationConstants.ISO_DATE.optional(),
  relationship: JoiValidationConstants.STRING.valid(
    ...Object.values(DOCUMENT_RELATIONSHIPS),
  ).optional(),
  scenario: JoiValidationConstants.STRING.valid(...SCENARIOS).optional(),
  secondaryDocument: joi // TODO: limit keys
    .object()
    .keys({
      documentTitle: JoiValidationConstants.STRING.max(500)
        .optional()
        .description('The title of the secondary document.'),
      documentType: JoiValidationConstants.STRING.valid(...ALL_DOCUMENT_TYPES)
        .required()
        .description('The type of the secondary document.'),
      eventCode: JoiValidationConstants.STRING.valid(...ALL_EVENT_CODES)
        .required()
        .description('The event code of the secondary document.'),
    })
    .when('scenario', {
      is: 'Nonstandard H',
      otherwise: joi.forbidden(),
      then: joi.optional(),
    })
    .description('The secondary document.'),
  servedAt: joi
    .alternatives()
    .conditional('servedParties', {
      is: joi.exist().not(null),
      otherwise: JoiValidationConstants.ISO_DATE.optional(),
      then: JoiValidationConstants.ISO_DATE.required(),
    })
    .description('When the document is served on the parties.'),
  servedParties: joi
    .array()
    .items({
      email: JoiValidationConstants.EMAIL.optional(),
      name: JoiValidationConstants.STRING.max(100)
        .required()
        .description('The name of a party from a contact, or "IRS"'),
      role: JoiValidationConstants.STRING.valid(...Object.values(ROLES))
        .optional()
        .description('Currently only required for the IRS'),
    })
    .when('servedAt', {
      is: joi.exist().not(null),
      otherwise: joi.optional(),
      then: joi.required(),
    })
    .description('The parties to whom the document has been served.'),
  servedPartiesCode: JoiValidationConstants.STRING.valid(
    ...Object.values(SERVED_PARTIES_CODES),
  )
    .allow(null)
    .optional()
    .description('Served parties code to override system-computed code.'),
  serviceDate: JoiValidationConstants.ISO_DATE.max('now')
    .optional()
    .allow(null)
    .description(
      'Used by certificate of service documents to construct the document title.',
    ),
  serviceStamp: JoiValidationConstants.STRING.optional(),
  signedAt: JoiValidationConstants.STRING.max(100)
    .when('isDraft', {
      is: false,
      otherwise: joi.optional().allow(null),
      then: joi.when('eventCode', {
        is: joi.valid(...EVENT_CODES_REQUIRING_SIGNATURE),
        otherwise: joi.optional().allow(null),
        then: joi.required(),
      }),
    })
    .description('The time at which the document was signed.'),
  signedByUserId: joi
    .when('signedJudgeName', {
      is: joi.exist().not(null),
      otherwise: JoiValidationConstants.UUID.optional().allow(null),
      then: JoiValidationConstants.UUID.required(),
    })
    .description('The id of the user who applied the signature.'),
  signedJudgeName: JoiValidationConstants.STRING.max(100)
    .when('isDraft', {
      is: false,
      otherwise: joi.optional().allow(null),
      then: joi.when('eventCode', {
        is: JoiValidationConstants.STRING.valid(
          ...EVENT_CODES_REQUIRING_JUDGE_SIGNATURE,
        ),
        otherwise: joi.optional().allow(null),
        then: joi.required(),
      }),
    })
    .description('The judge who signed the document.'),
  signedJudgeUserId: JoiValidationConstants.UUID.optional() // Optional for now, but should eventually follow same logic as signedJudgeName
    .allow(null)
    .description('The user id of the judge who signed the document.'),
  strickenAt: JoiValidationConstants.ISO_DATE.max('now')
    .optional()
    .description('Date that this Docket Record item was stricken.'),
  strickenBy: JoiValidationConstants.STRING.optional(),
  strickenByUserId: JoiValidationConstants.STRING.optional(),
  supportingDocument: JoiValidationConstants.STRING.max(100)
    .optional()
    .allow(null),
  trialLocation: JoiValidationConstants.STRING.max(100)
    .optional()
    .allow(null)
    .description(
      'An optional trial location used when generating a fully concatenated document title.',
    ),
  userId: JoiValidationConstants.UUID.required(),
  workItem: joi.object().optional(),
};

const WORK_ITEM_VALIDATION_RULE_KEYS = {
  assigneeId: JoiValidationConstants.UUID.allow(null).optional(),
  assigneeName: JoiValidationConstants.STRING.max(100).allow(null).optional(), // should be a Message entity at some point
  associatedJudge: JoiValidationConstants.STRING.max(100).required(),
  caseIsInProgress: joi.boolean().optional(),
  caseStatus: JoiValidationConstants.STRING.valid(
    ...Object.values(CASE_STATUS_TYPES),
  ).optional(),
  caseTitle: JoiValidationConstants.STRING.max(500).optional(),
  completedAt: JoiValidationConstants.ISO_DATE.optional(),
  completedBy: JoiValidationConstants.STRING.max(100).optional().allow(null),
  completedByUserId: JoiValidationConstants.UUID.optional().allow(null),
  completedMessage: JoiValidationConstants.STRING.max(100)
    .optional()
    .allow(null),
  createdAt: JoiValidationConstants.ISO_DATE.optional(),
  // TODO: validate DocketEntry in WorkItem
  // docketEntry: joi.object().keys(DOCKET_ENTRY_VALIDATION_RULE_KEYS).required(),
  docketEntry: joi.object().required(),
  docketNumber: JoiValidationConstants.DOCKET_NUMBER.required().description(
    'Unique case identifier in XXXXX-YY format.',
  ),
  docketNumberWithSuffix: JoiValidationConstants.STRING.optional().description(
    'Auto-generated from docket number and the suffix.',
  ),
  entityName: JoiValidationConstants.STRING.valid('WorkItem').required(),
  hideFromPendingMessages: joi.boolean().optional(),
  highPriority: joi.boolean().optional(),
  inProgress: joi.boolean().optional(),
  isInitializeCase: joi.boolean().optional(),
  isRead: joi.boolean().optional(),
  section: JoiValidationConstants.STRING.valid(
    ...SECTIONS,
    ...CHAMBERS_SECTIONS,
    ...Object.values(ROLES),
    IRS_SYSTEM_SECTION,
  ).required(),
  sentBy: JoiValidationConstants.STRING.max(100)
    .required()
    .description('The name of the user that sent the WorkItem'),
  sentBySection: JoiValidationConstants.STRING.valid(
    ...SECTIONS,
    ...CHAMBERS_SECTIONS,
    ...Object.values(ROLES),
  ).optional(),
  sentByUserId: JoiValidationConstants.UUID.optional(),
  trialDate: JoiValidationConstants.ISO_DATE.optional().allow(null),
  updatedAt: JoiValidationConstants.ISO_DATE.required(),
  workItemId: JoiValidationConstants.UUID.required(),
};

const PETITIONER_VALIDATION_RULE_KEYS = {};

// TODO: validate workItems in DocketEntry
// DOCKET_ENTRY_VALIDATION_RULE_KEYS.workItem = joi
//   .object()
//   .keys(WORK_ITEM_VALIDATION_RULE_KEYS)
//   .optional();

module.exports = {
  DOCKET_ENTRY_VALIDATION_RULE_KEYS,
  DOCKET_ENTRY_VALIDATION_RULES: joi
    .object()
    .keys(DOCKET_ENTRY_VALIDATION_RULE_KEYS),
  PETITIONER_VALIDATION_RULE_KEYS,
  WORK_ITEM_VALIDATION_RULES: joi.object().keys(WORK_ITEM_VALIDATION_RULE_KEYS),
};
