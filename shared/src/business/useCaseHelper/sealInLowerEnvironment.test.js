const { applicationContext } = require('../test/createTestApplicationContext');
const { MOCK_CASE } = require('../../test/mockCase');
const { ROLES } = require('../entities/EntityConstants');
const { sealInLowerEnvironment } = require('./sealInLowerEnvironment');

describe('sealInLowerEnvironment', () => {
  beforeAll(() => {
    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockReturnValue(MOCK_CASE);
    applicationContext.getNotificationGateway().sendNotificationOfSealing =
      jest.fn();
    applicationContext.isCurrentColorActive = jest.fn().mockReturnValue(true);
    applicationContext.getCurrentUser.mockReturnValue({
      role: ROLES.docketClerk,
    });
  });

  it('should seal the case with the docketNumber provided and return the updated case', async () => {
    const result = await sealInLowerEnvironment(applicationContext, [
      {
        docketNumber: MOCK_CASE.docketNumber,
      },
    ]);
    expect(applicationContext.getUseCases().sealCaseInteractor).toBeCalled();
    expect(result[0].sealedDate).toBeTruthy();
  });

  it('should only log a warning if we do not have a docketNumber', async () => {
    await sealInLowerEnvironment(applicationContext, [{}]);
    expect(
      applicationContext.getUseCases().sealCaseInteractor,
    ).not.toBeCalled();
    expect(applicationContext.logger.warn).toBeCalled();
  });

  it('should not execute if the current color is not active', async () => {
    applicationContext.isCurrentColorActive = jest.fn().mockReturnValue(false);
    await sealInLowerEnvironment(applicationContext, [
      {
        docketNumber: '123-21',
      },
    ]);
    expect(
      applicationContext.getUseCases().sealCaseInteractor,
    ).not.toBeCalled();
  });
});
