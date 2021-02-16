const { genericHandler } = require('../genericHandler');

/**
 * updates other statistics on the case (litigation costs and damages)
 *
 * @param {object} event the AWS event object
 * @returns {Promise<*|undefined>} the api gateway response object containing the statusCode, body, and headers
 */
exports.addExistingUserToCaseLambda = event =>
  genericHandler(event, async ({ applicationContext }) => {
    return await applicationContext
      .getUseCases()
      .addExistingUserToCaseInteractor({
        applicationContext,
        ...event.pathParameters,
        ...JSON.parse(event.body),
      });
  });
