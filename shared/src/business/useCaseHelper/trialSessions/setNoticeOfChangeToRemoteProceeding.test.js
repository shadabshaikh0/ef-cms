const {
  applicationContext,
} = require('../../test/createTestApplicationContext');
const {
  CASE_STATUS_TYPES,
  SYSTEM_GENERATED_DOCUMENT_TYPES,
} = require('../../entities/EntityConstants');
const {
  MOCK_TRIAL_INPERSON,
  MOCK_TRIAL_REMOTE,
} = require('../../../test/mockTrial');
const {
  setNoticeOfChangeToRemoteProceeding,
} = require('./setNoticeOfChangeToRemoteProceeding');
const { Case } = require('../../entities/cases/Case');
const { MOCK_CASE } = require('../../../test/mockCase');

describe('setNoticeOfChangeToRemoteProceeding', () => {
  const mockUserId = '85a5b1c8-1eed-44b6-932a-967af060597a';
  const mockNoticePdf = 'Blah blah blah';
  const mockNewPdf = 'This is some other newer stuff';

  const mockOpenCase = new Case(
    {
      ...MOCK_CASE,
      trialDate: '2019-03-01T21:42:29.073Z',
      trialSessionId: MOCK_TRIAL_INPERSON.trialSessionId,
    },
    { applicationContext },
  );

  const mockClosedCase = new Case(
    {
      ...MOCK_CASE,
      closedDate: '2020-03-01T21:42:29.073Z',
      docketNumber: '999-99',
      status: CASE_STATUS_TYPES.closed,
      trialDate: '2019-03-01T21:42:29.073Z',
      trialSessionId: MOCK_TRIAL_REMOTE.trialSessionId,
    },
    { applicationContext },
  );

  beforeEach(() => {
    applicationContext
      .getUseCases()
      .generateNoticeOfChangeToRemoteProceedingInteractor.mockReturnValue(
        mockNoticePdf,
      );
  });

  it('should not do anything when the case status is closed', async () => {
    await setNoticeOfChangeToRemoteProceeding(applicationContext, {
      caseEntity: mockClosedCase,
      currentTrialSession: MOCK_TRIAL_INPERSON,
      newPdfDoc: mockNewPdf,
      newTrialSessionEntity: MOCK_TRIAL_REMOTE,
      userId: mockUserId,
    });

    expect(
      applicationContext.getUseCases()
        .generateNoticeOfChangeToRemoteProceedingInteractor,
    ).not.toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway().saveDocumentFromLambda,
    ).not.toHaveBeenCalled();
    expect(
      applicationContext.getUseCaseHelpers().serveDocumentAndGetPaperServicePdf,
    ).not.toHaveBeenCalled();
  });

  it('should not do anything when the case status is open but the trial session proceeding type has not changed', async () => {
    await setNoticeOfChangeToRemoteProceeding(applicationContext, {
      caseEntity: mockOpenCase,
      currentTrialSession: MOCK_TRIAL_INPERSON,
      newPdfDoc: mockNewPdf,
      newTrialSessionEntity: MOCK_TRIAL_INPERSON,
      userId: mockUserId,
    });

    expect(
      applicationContext.getUseCases()
        .generateNoticeOfChangeToRemoteProceedingInteractor,
    ).not.toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway().saveDocumentFromLambda,
    ).not.toHaveBeenCalled();
    expect(
      applicationContext.getUseCaseHelpers().serveDocumentAndGetPaperServicePdf,
    ).not.toHaveBeenCalled();
  });

  it('should generate and serve a NORP when the proceeding type changes from in person to remote and the case status is not closed', async () => {
    await setNoticeOfChangeToRemoteProceeding(applicationContext, {
      caseEntity: mockOpenCase,
      currentTrialSession: MOCK_TRIAL_INPERSON,
      newPdfDoc: mockNewPdf,
      newTrialSessionEntity: MOCK_TRIAL_REMOTE,
      userId: mockUserId,
    });

    expect(
      applicationContext.getUseCases()
        .generateNoticeOfChangeToRemoteProceedingInteractor.mock.calls[0][1],
    ).toMatchObject({
      docketNumber: mockOpenCase.docketNumber,
      trialSessionInformation: {
        chambersPhoneNumber: '1111111',
        joinPhoneNumber: '0987654321',
        judgeName: 'Chief Judge',
        meetingId: '1234567890',
        password: 'abcdefg',
        startDate: '2025-12-01T00:00:00.000Z',
        startTime: undefined,
        trialLocation: 'Birmingham, Alabama',
      },
    });
    expect(
      applicationContext.getUseCaseHelpers().createAndServeNoticeDocketEntry
        .mock.calls[0][1],
    ).toMatchObject({
      caseEntity: mockOpenCase,
      documentInfo:
        SYSTEM_GENERATED_DOCUMENT_TYPES.noticeOfChangeToRemoteProceeding,
      newPdfDoc: mockNewPdf,
      noticePdf: mockNoticePdf,
      userId: mockUserId,
    });
  });
});
