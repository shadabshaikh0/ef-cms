const {
  FORMATS,
} = require('../../../shared/src/business/utilities/DateHandler');
const { createCookieString } = require('../utilities/cookieFormatting');
const { genericHandler } = require('../genericHandler');

/**
 * Sets the authentication cookie based on the OAuth code
 *
 * @param {object} event the AWS event object
 * @returns {Promise<*|undefined>} the api gateway response object containing the statusCode, body, and headers
 */
exports.authenticateUserLambda = event =>
  genericHandler(event, async ({ applicationContext }) => {
    const { refreshToken, token } = await applicationContext
      .getUseCases()
      .authenticateUserInteractor(applicationContext, JSON.parse(event.body));
    const expiresAtIso = applicationContext.getUtilities().calculateISODate({
      dateString: applicationContext.getUtilities().createISODateString(),
      howMuch: 29,
      units: 'days',
    });

    //unilaterally converts the ET timezone'd date/time to UTC without actually changing the hour
    const expiresAtUtc = applicationContext
      .getUtilities()
      .formatDateString(expiresAtIso, FORMATS.COOKIE);
    return {
      body: JSON.stringify({ token }),
      headers: {
        'Set-Cookie': createCookieString(
          'refreshToken',
          refreshToken,
          expiresAtUtc,
          process.env.EFCMS_DOMAIN,
        ),
      },
      statusCode: 200,
    };
  });
