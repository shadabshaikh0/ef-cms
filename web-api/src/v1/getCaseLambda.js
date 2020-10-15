const { genericHandler } = require('../genericHandler');
const { marshallCase } = require('./marshallers/marshallCase');
const { v1ApiWrapper } = require('./v1ApiWrapper');

/**
 * used for fetching a single case and returning it in v1 api format
 *
 * @param {object} event the AWS event object
 * @returns {Promise<*|undefined>} the api gateway response object containing the statusCode, body, and headers
 */
exports.getCaseLambda = event =>
  genericHandler(event, async ({ applicationContext }) => {
    return v1ApiWrapper(async () => {
      const caseObject = await applicationContext
        .getUseCases()
        .getCaseInteractor({
          applicationContext,
          docketNumber: event.pathParameters.docketNumber,
        });

      return marshallCase(caseObject);
    });
  });
