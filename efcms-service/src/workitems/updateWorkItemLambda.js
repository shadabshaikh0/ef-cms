const { handle, getAuthHeader } = require('../middleware/apiGatewayHelper');
const createApplicationContext = require('../applicationContext');

/**
 * updates a work item
 *
 * @param event
 * @returns {Promise<*|undefined>}
 */
exports.put = event =>
  handle(() => {
    const userId = getAuthHeader(event);
    const applicationContext = createApplicationContext({ userId });
    return applicationContext.getUpdateWorkItemInteractor(event)({
      ...JSON.parse(event.body),
      workItemId: event.pathParameters.workItemId,
      workItemToUpdate: JSON.parse(event.body),
      userId,
      applicationContext,
    });
  });