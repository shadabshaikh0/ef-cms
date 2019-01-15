const Case = require('../entities/Case');
const {
  isAuthorized,
  UPDATE_CASE,
} = require('../../authorization/authorizationClientService');

const {
  UnauthorizedError,
  InvalidEntityError,
} = require('../../errors/errors');

/**
 * sendPetitionToIRS
 *
 * @param caseId
 * @param userId
 * @param applicationContext
 * @returns {Promise<*>}
 */
exports.sendPetitionToIRS = async ({ caseId, userId, applicationContext }) => {
  if (!isAuthorized(userId, UPDATE_CASE)) {
    throw new UnauthorizedError('Unauthorized for send to IRS');
  }

  const caseRecord = await applicationContext.getUseCases().getCase({
    userId,
    caseId,
    applicationContext,
  });

  const caseEntity = new Case(caseRecord);
  const invalidEntityError = new InvalidEntityError('Invalid for send to IRS');
  caseEntity.validateWithError(invalidEntityError);

  let sendDate;
  try {
    sendDate = await applicationContext.irsGateway.sendToIRS({
      caseToSend: caseEntity.toRawObject(),
      applicationContext,
    });
  } catch (error) {
    throw new Error(`error sending ${caseId} to IRS: ${error.message}`);
  }

  if (!sendDate) throw invalidEntityError;

  caseEntity.markAsSentToIRS(sendDate).validateWithError(invalidEntityError);

  await applicationContext.getPersistenceGateway().saveCase({
    caseToSave: caseEntity.toRawObject(),
    applicationContext,
  });

  return sendDate;
};