const {
  applicationContext,
} = require('../../test/createTestApplicationContext');
const {
  updateTrialSessionWorkingCopyInteractor,
} = require('./updateTrialSessionWorkingCopyInteractor');
const { omit } = require('lodash');
const { ROLES } = require('../../entities/EntityConstants');
const { UnauthorizedError } = require('../../../errors/errors');

let user;

const MOCK_WORKING_COPY = {
  caseMetadata: {
    '101-19': { trialStatus: 'dismissed' },
  },
  sort: 'practitioner',
  sortOrder: 'desc',
  trialSessionId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
  userId: 'd7d90c05-f6cd-442c-a168-202db587f16f',
};

describe('Update trial session working copy', () => {
  beforeEach(() => {
    applicationContext.environment.stage = 'local';
    applicationContext.getCurrentUser.mockImplementation(() => user);
    applicationContext
      .getPersistenceGateway()
      .getTrialSessionWorkingCopy.mockReturnValue(MOCK_WORKING_COPY);
  });

  it('throws error if user is unauthorized', async () => {
    user = {
      role: 'unauthorizedRole',
      userId: 'unauthorizedUser',
    };

    applicationContext
      .getPersistenceGateway()
      .updateTrialSessionWorkingCopy.mockReturnValue({});

    await expect(
      updateTrialSessionWorkingCopyInteractor(applicationContext, {
        trialSessionWorkingCopyToUpdate: MOCK_WORKING_COPY,
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('throws an error if the entity returned from persistence is invalid', async () => {
    user = {
      role: ROLES.judge,
      userId: 'd7d90c05-f6cd-442c-a168-202db587f16f',
    };

    applicationContext
      .getPersistenceGateway()
      .getTrialSessionWorkingCopy.mockResolvedValue(
        omit(MOCK_WORKING_COPY, 'userId'),
      );

    await expect(
      updateTrialSessionWorkingCopyInteractor(applicationContext, {
        trialSessionWorkingCopyToUpdate: MOCK_WORKING_COPY,
      }),
    ).rejects.toThrow('The TrialSessionWorkingCopy entity was invalid');
  });

  it('correctly returns data from persistence', async () => {
    user = {
      role: ROLES.judge,
      userId: 'd7d90c05-f6cd-442c-a168-202db587f16f',
    };

    applicationContext
      .getPersistenceGateway()
      .updateTrialSessionWorkingCopy.mockResolvedValue(MOCK_WORKING_COPY);

    const result = await updateTrialSessionWorkingCopyInteractor(
      applicationContext,
      {
        trialSessionWorkingCopyToUpdate: MOCK_WORKING_COPY,
      },
    );
    expect(result).toMatchObject(MOCK_WORKING_COPY);
  });
});
