const {
  isAuthorized,
  WORKITEM,
} = require('../../../authorization/authorizationClientService');
const { IRS_BATCH_SYSTEM_SECTION } = require('../../entities/WorkQueue');
const { UnauthorizedError } = require('../../../errors/errors');

/**
 *
 * @param {object} providers the providers object
 * @param {object} providers.applicationContext the application context
 * @param {string} providers.userId the user to get the document qc served box
 * @returns {object} the work items in the user document served inbox
 */
exports.getDocumentQCServedForUserInteractor = async ({
  applicationContext,
  userId,
}) => {
  const user = applicationContext.getCurrentUser();

  if (!isAuthorized(user, WORKITEM)) {
    throw new UnauthorizedError('Unauthorized');
  }

  const workItems = await applicationContext
    .getPersistenceGateway()
    .getDocumentQCServedForUser({
      applicationContext,
      userId,
    });

  return workItems.filter(workItem =>
    user.role === 'petitionsclerk'
      ? workItem.section === IRS_BATCH_SYSTEM_SECTION
      : true,
  );
};