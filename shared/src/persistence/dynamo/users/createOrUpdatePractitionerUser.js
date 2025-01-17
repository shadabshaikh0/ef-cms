const client = require('../../dynamodbClientService');
const { isUserAlreadyCreated } = require('./createOrUpdateUser');
const { ROLES } = require('../../../business/entities/EntityConstants');

exports.createUserRecords = async ({ applicationContext, user, userId }) => {
  delete user.password;

  if (user.barNumber === '') {
    delete user.barNumber;
  }

  await client.put({
    Item: {
      ...user,
      pk: `user|${userId}`,
      sk: `user|${userId}`,
      userId,
    },
    applicationContext,
  });

  if (user.name && user.barNumber) {
    const upperCaseName = user.name.toUpperCase();
    await client.put({
      Item: {
        pk: `${user.role}|${upperCaseName}`,
        sk: `user|${userId}`,
      },
      applicationContext,
    });
    const upperCaseBarNumber = user.barNumber.toUpperCase();
    await client.put({
      Item: {
        pk: `${user.role}|${upperCaseBarNumber}`,
        sk: `user|${userId}`,
      },
      applicationContext,
    });
  }

  return {
    ...user,
    userId,
  };
};

exports.createOrUpdatePractitionerUser = async ({
  applicationContext,
  user,
}) => {
  let userId = applicationContext.getUniqueId();
  const practitionerRoleTypes = [
    ROLES.privatePractitioner,
    ROLES.irsPractitioner,
    ROLES.inactivePractitioner,
  ];

  if (!practitionerRoleTypes.includes(user.role)) {
    throw new Error(
      `Role must be ${ROLES.privatePractitioner}, ${ROLES.irsPractitioner}, or ${ROLES.inactivePractitioner}`,
    );
  }

  const userEmail = user.email || user.pendingEmail;

  if (!userEmail) {
    return await exports.createUserRecords({
      applicationContext,
      user,
      userId,
    });
  }

  const userExists = await isUserAlreadyCreated({
    applicationContext,
    email: userEmail,
    userPoolId: process.env.USER_POOL_ID,
  });

  if (!userExists) {
    const response = await applicationContext
      .getCognito()
      .adminCreateUser({
        UserAttributes: [
          {
            Name: 'email_verified',
            Value: 'True',
          },
          {
            Name: 'email',
            Value: userEmail,
          },
          {
            Name: 'custom:role',
            Value: user.role,
          },
          {
            Name: 'name',
            Value: user.name,
          },
        ],
        UserPoolId: process.env.USER_POOL_ID,
        Username: userEmail,
      })
      .promise();
    if (response && response.User && response.User.Username) {
      userId = response.User.Username;
    }
  } else {
    const response = await applicationContext
      .getCognito()
      .adminGetUser({
        UserPoolId: process.env.USER_POOL_ID,
        Username: userEmail,
      })
      .promise();

    await applicationContext
      .getCognito()
      .adminUpdateUserAttributes({
        UserAttributes: [
          {
            Name: 'custom:role',
            Value: user.role,
          },
        ],
        UserPoolId: process.env.USER_POOL_ID,
        Username: response.Username,
      })
      .promise();

    userId = response.Username;
  }

  return await exports.createUserRecords({
    applicationContext,
    user,
    userId,
  });
};
