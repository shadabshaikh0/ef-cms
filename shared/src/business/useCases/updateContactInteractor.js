const {
  aggregatePartiesForService,
} = require('../utilities/aggregatePartiesForService');
const {
  DOCKET_SECTION,
  DOCUMENT_PROCESSING_STATUS_OPTIONS,
  SERVICE_INDICATOR_TYPES,
} = require('../entities/EntityConstants');
const { addCoverToPdf } = require('./addCoversheetInteractor');
const { Case } = require('../entities/cases/Case');
const { cloneDeep } = require('lodash');
const { DocketEntry } = require('../entities/DocketEntry');
const { getCaseCaptionMeta } = require('../utilities/getCaseCaptionMeta');
const { isEmpty } = require('lodash');
const { NotFoundError, UnauthorizedError } = require('../../errors/errors');
const { WorkItem } = require('../entities/WorkItem');

/**
 * updateContactInteractor
 *
 * @param {object} applicationContext the application context
 * @param {object} providers the providers object
 * @param {string} providers.docketNumber the docket number of the case to update the primary contact
 * @param {object} providers.contactInfo the contact info to update on the case
 * @returns {object} the updated case
 */
exports.updateContactInteractor = async (
  applicationContext,
  { contactInfo, docketNumber },
) => {
  const user = applicationContext.getCurrentUser();

  const editableFields = {
    address1: contactInfo.address1,
    address2: contactInfo.address2,
    address3: contactInfo.address3,
    city: contactInfo.city,
    country: contactInfo.country,
    countryType: contactInfo.countryType,
    phone: contactInfo.phone,
    postalCode: contactInfo.postalCode,
    state: contactInfo.state,
  };

  const caseToUpdate = await applicationContext
    .getPersistenceGateway()
    .getCaseByDocketNumber({
      applicationContext,
      docketNumber,
    });

  if (!caseToUpdate) {
    throw new NotFoundError(`Case ${docketNumber} was not found.`);
  }

  let caseEntity = new Case(
    {
      ...caseToUpdate,
    },
    { applicationContext },
  );

  const oldCaseContact = cloneDeep(
    caseEntity.getPetitionerById(contactInfo.contactId),
  );

  const updatedCaseContact = {
    ...oldCaseContact,
    ...editableFields,
  };

  try {
    caseEntity.updatePetitioner(updatedCaseContact);
  } catch (e) {
    throw new NotFoundError(e);
  }

  const rawUpdatedCase = caseEntity.validate().toRawObject();
  caseEntity = new Case(rawUpdatedCase, { applicationContext });

  const updatedPetitioner = caseEntity.getPetitionerById(contactInfo.contactId);

  const userIsAssociated = caseEntity.isAssociatedUser({
    user,
  });

  if (!userIsAssociated) {
    throw new UnauthorizedError('Unauthorized for update case contact');
  }

  const documentType = applicationContext
    .getUtilities()
    .getDocumentTypeForAddressChange({
      newData: editableFields,
      oldData: oldCaseContact,
    });

  if (!oldCaseContact.isAddressSealed && documentType) {
    const { caseCaptionExtension, caseTitle } = getCaseCaptionMeta(caseEntity);

    const changeOfAddressPdf = await applicationContext
      .getDocumentGenerators()
      .changeOfAddress({
        applicationContext,
        content: {
          caseCaptionExtension,
          caseTitle,
          docketNumber: caseEntity.docketNumber,
          docketNumberWithSuffix: caseEntity.docketNumberWithSuffix,
          documentTitle: documentType.title,
          documentType,
          name: contactInfo.name,
          newData: contactInfo,
          oldData: oldCaseContact,
        },
      });

    const newDocketEntryId = applicationContext.getUniqueId();

    const changeOfAddressDocketEntry = new DocketEntry(
      {
        addToCoversheet: true,
        additionalInfo: `for ${updatedPetitioner.name}`,
        docketEntryId: newDocketEntryId,
        docketNumber: caseEntity.docketNumber,
        documentTitle: documentType.title,
        documentType: documentType.title,
        eventCode: documentType.eventCode,
        filers: [updatedPetitioner.contactId],
        isAutoGenerated: true,
        isFileAttached: true,
        isOnDocketRecord: true,
        partyPrimary: true,
        processingStatus: DOCUMENT_PROCESSING_STATUS_OPTIONS.COMPLETE,
        userId: user.userId,
      },
      { applicationContext, petitioners: caseEntity.petitioners },
    );

    const servedParties = aggregatePartiesForService(caseEntity);

    changeOfAddressDocketEntry.setAsServed(servedParties.all);

    const isContactRepresented =
      caseEntity.isUserIdRepresentedByPrivatePractitioner(
        contactInfo.contactId,
      );

    const partyWithPaperService = caseEntity.hasPartyWithServiceType(
      SERVICE_INDICATOR_TYPES.SI_PAPER,
    );

    if (!isContactRepresented || partyWithPaperService) {
      const workItem = new WorkItem(
        {
          assigneeId: null,
          assigneeName: null,
          associatedJudge: caseEntity.associatedJudge,
          caseIsInProgress: caseEntity.inProgress,
          caseStatus: caseEntity.status,
          caseTitle: Case.getCaseTitle(caseEntity.caseCaption),
          docketEntry: {
            ...changeOfAddressDocketEntry.toRawObject(),
            createdAt: changeOfAddressDocketEntry.createdAt,
          },
          docketNumber: caseEntity.docketNumber,
          docketNumberWithSuffix: caseEntity.docketNumberWithSuffix,
          section: DOCKET_SECTION,
          sentBy: user.name,
          sentByUserId: user.userId,
        },
        { applicationContext },
      );

      changeOfAddressDocketEntry.setWorkItem(workItem);

      await applicationContext.getPersistenceGateway().saveWorkItem({
        applicationContext,
        workItem: workItem.validate().toRawObject(),
      });
    }

    const { pdfData: changeOfAddressPdfWithCover } = await addCoverToPdf({
      applicationContext,
      caseEntity,
      docketEntryEntity: changeOfAddressDocketEntry,
      pdfData: changeOfAddressPdf,
    });

    changeOfAddressDocketEntry.numberOfPages = await applicationContext
      .getUseCaseHelpers()
      .countPagesInDocument({
        applicationContext,
        documentBytes: changeOfAddressPdfWithCover,
      });

    caseEntity.addDocketEntry(changeOfAddressDocketEntry);

    await applicationContext.getUseCaseHelpers().sendServedPartiesEmails({
      applicationContext,
      caseEntity,
      docketEntryId: changeOfAddressDocketEntry.docketEntryId,
      servedParties,
    });

    await applicationContext.getPersistenceGateway().saveDocumentFromLambda({
      applicationContext,
      document: changeOfAddressPdfWithCover,
      key: newDocketEntryId,
    });
  }

  const contactDiff = applicationContext.getUtilities().getAddressPhoneDiff({
    newData: editableFields,
    oldData: oldCaseContact,
  });

  const shouldUpdateCase = !isEmpty(contactDiff) || documentType;

  if (shouldUpdateCase) {
    await applicationContext.getUseCaseHelpers().updateCaseAndAssociations({
      applicationContext,
      caseToUpdate: caseEntity,
    });
  }

  return caseEntity.toRawObject();
};
