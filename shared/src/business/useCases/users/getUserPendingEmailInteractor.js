const {
  isAuthorized,
  ROLE_PERMISSIONS,
} = require('../../../authorization/authorizationClientService');
const { UnauthorizedError } = require('../../../errors/errors');
const { User } = require('../../entities/User');

/**
 * getUserPendingEmailInteractor
 *
 * @param {object} providers the providers object
 * @param {object} providers.applicationContext the application context
 * @param {string} providers.userId the userId
 * @returns {Promise} the user's pending email
 */
exports.getUserPendingEmailInteractor = async ({
  applicationContext,
  userId,
}) => {
  const authorizedUser = applicationContext.getCurrentUser();

  if (!isAuthorized(authorizedUser, ROLE_PERMISSIONS.GET_USER_PENDING_EMAIL)) {
    throw new UnauthorizedError('Unauthorized to get user pending email');
  }

  const userRaw = await applicationContext.getPersistenceGateway().getUserById({
    applicationContext,
    userId,
  });

  if (!userRaw) return;

  const validatedUserRaw = new User(userRaw).validate().toRawObject();

  return validatedUserRaw.pendingEmail;
};