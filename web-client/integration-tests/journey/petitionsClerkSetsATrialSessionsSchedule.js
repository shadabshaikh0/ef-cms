import { wait } from '../helpers';

export const petitionsClerkSetsATrialSessionsSchedule = test => {
  return it('Petitions Clerk Sets A Trial Sessions Schedule', async () => {
    await test.runSequence('gotoTrialSessionDetailSequence', {
      trialSessionId: test.trialSessionId,
    });
    await test.runSequence('setTrialSessionCalendarSequence');
    await wait(1000);

    expect(test.getState('currentPage')).toEqual('TrialSessionDetail');
    expect(test.getState('trialSession.isCalendared')).toBeTruthy();
  });
};
