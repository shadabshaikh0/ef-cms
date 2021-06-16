const AWS = require('aws-sdk');
const connectionClass = require('http-aws-es');
const elasticsearch = require('elasticsearch');
const {
  createLogger,
} = require('../../../../shared/src/utilities/createLogger');
const {
  createPetitionerAccountInteractor,
} = require('../../../../shared/src/business/useCases/users/createPetitionerAccountInteractor');
const {
  getCaseByDocketNumber,
} = require('../../../../shared/src/persistence/dynamo/cases/getCaseByDocketNumber');
const {
  getCasesByUserId,
} = require('../../../../shared/src/persistence/elasticsearch/getCasesByUserId');
const {
  getDocketNumbersByUser,
} = require('../../../../shared/src/persistence/dynamo/cases/getDocketNumbersByUser');
const {
  getUserById,
} = require('../../../../shared/src/persistence/dynamo/users/getUserById');
const {
  persistUser,
} = require('../../../../shared/src/persistence/dynamo/users/persistUser');
const {
  setUserEmailFromPendingEmailInteractor,
} = require('../../../../shared/src/business/useCases/users/setUserEmailFromPendingEmailInteractor');
const {
  updateCase,
} = require('../../../../shared/src/persistence/dynamo/cases/updateCase');
const {
  updateCaseAndAssociations,
} = require('../../../../shared/src/business/useCaseHelper/caseAssociation/updateCaseAndAssociations');
const {
  updateUser,
} = require('../../../../shared/src/persistence/dynamo/users/updateUser');

const { DynamoDB, EnvironmentCredentials } = AWS;

const logger = createLogger({
  defaultMeta: {
    environment: {
      stage: process.env.STAGE || 'local',
    },
  },
});

let searchClientCache = null;

const environment = {
  elasticsearchEndpoint:
    process.env.ELASTICSEARCH_ENDPOINT || 'http://localhost:9200',
  region: process.env.AWS_REGION || 'us-east-1',
};

const applicationContext = {
  getCurrentUser: () => ({}),
  getDocumentClient: () => {
    return new DynamoDB.DocumentClient({
      endpoint: process.env.DYNAMODB_ENDPOINT,
      region: process.env.AWS_REGION,
    });
  },
  getEnvironment: () => ({
    dynamoDbTableName: process.env.DYNAMODB_TABLE_NAME,
    stage: process.env.STAGE,
  }),
  getPersistenceGateway: () => ({
    getCaseByDocketNumber,
    getCasesByUserId,
    getDocketNumbersByUser,
    getUserById,
    persistUser,
    updateCase,
    updateUser,
  }),
  getSearchClient: () => {
    if (!searchClientCache) {
      searchClientCache = new elasticsearch.Client({
        amazonES: {
          credentials: new EnvironmentCredentials('AWS'),
          region: environment.region,
        },
        apiVersion: '7.4',
        awsConfig: new AWS.Config({ region: 'us-east-1' }),
        connectionClass,
        host: environment.elasticsearchEndpoint,
        log: 'warning',
        port: 443,
        protocol: 'https',
      });
    }
    return searchClientCache;
  },
  getUseCaseHelpers: () => ({ updateCaseAndAssociations }),
  getUseCases: () => ({
    createPetitionerAccountInteractor,
    setUserEmailFromPendingEmailInteractor,
  }),
  logger: {
    debug: logger.debug.bind(logger),
    error: logger.error.bind(logger),
    info: logger.info.bind(logger),
  },
};

exports.applicationContext = applicationContext;

exports.handler = async event => {
  applicationContext.logger.info('we got an event', event);
  if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
    const { email, name, sub: userId } = event.request.userAttributes;
    applicationContext.logger.info(
      'we are here at PostConfirmation_ConfirmSignUp',
    );

    const user = await applicationContext
      .getUseCases()
      .createPetitionerAccountInteractor(applicationContext, {
        email,
        name,
        userId,
      });

    applicationContext.logger.info('Petitioner signup processed', {
      event,
      user,
    });
  } else if (event.triggerSource === 'PostAuthentication_Authentication') {
    const { email, sub } = event.request.userAttributes;
    const userId = event.request.userAttributes['custom:userId'] || sub;
    applicationContext.logger.info('email', email);
    applicationContext.logger.info('sub', sub);
    applicationContext.logger.info('userId', userId);

    const userFromPersistence = await applicationContext
      .getPersistenceGateway()
      .getUserById({ applicationContext, userId });

    applicationContext.logger.info('userFromPersistence', userFromPersistence);

    if (
      userFromPersistence &&
      userFromPersistence.pendingEmail &&
      userFromPersistence.pendingEmail === email
    ) {
      const updatedUser = await applicationContext
        .getUseCases()
        .setUserEmailFromPendingEmailInteractor(applicationContext, {
          user: userFromPersistence,
        });

      applicationContext.logger.info(
        'Petitioner post authentication processed',
        {
          event,
          updatedUser,
        },
      );
    }
  }

  return event;
};
