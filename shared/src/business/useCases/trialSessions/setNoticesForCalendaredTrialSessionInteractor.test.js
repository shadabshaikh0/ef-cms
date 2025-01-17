const {
  applicationContext,
  testPdfDoc,
} = require('../../test/createTestApplicationContext');
const {
  MOCK_CASE,
  MOCK_ELIGIBLE_CASE_WITH_PRACTITIONERS,
} = require('../../../test/mockCase');
const {
  SERVICE_INDICATOR_TYPES,
  SYSTEM_GENERATED_DOCUMENT_TYPES,
  TRIAL_SESSION_PROCEEDING_TYPES,
} = require('../../entities/EntityConstants');
const {
  setNoticesForCalendaredTrialSessionInteractor,
} = require('./setNoticesForCalendaredTrialSessionInteractor');
const { getFakeFile } = require('../../test/getFakeFile');
const { PARTY_TYPES, ROLES } = require('../../entities/EntityConstants');
const { User } = require('../../entities/User');

const findNoticeOfTrialDocketEntry = caseRecord => {
  return caseRecord.docketEntries.find(
    doc =>
      doc.documentType ===
      SYSTEM_GENERATED_DOCUMENT_TYPES.noticeOfTrial.documentType,
  );
};

const MOCK_TRIAL = {
  judge: {
    name: 'Judge Mary Kate and Ashley',
    userId: '410e4ade-6ad5-4fc4-8741-3f8352c72a0c',
  },
  maxCases: 100,
  proceedingType: TRIAL_SESSION_PROCEEDING_TYPES.inPerson,
  sessionType: 'Regular',
  startDate: '2025-12-01T00:00:00.000Z',
  term: 'Fall',
  termYear: '2025',
  trialLocation: 'Birmingham, Alabama',
};
const serviceInfo = {
  docketEntryId: '',
  hasPaper: false,
  url: 'www.example.com',
};

const user = new User({
  name: 'Docket Clerk',
  role: ROLES.docketClerk,
  userId: '6805d1ab-18d0-43ec-bafb-654e83405416',
});
let calendaredCases;
let trialSession;
const case0 = {
  // should get electronic service
  ...MOCK_CASE,
  docketNumber: '102-20',
  procedureType: 'Regular',
};
const case1 = {
  // should get paper service
  ...MOCK_CASE,
  docketNumber: '103-20',
  isPaper: true,
  mailingDate: 'testing',
  procedureType: 'Small',
};

const caseWithNoProSePetitioner = {
  ...MOCK_CASE,
  privatePractitioners: [
    {
      ...MOCK_ELIGIBLE_CASE_WITH_PRACTITIONERS.privatePractitioners[0],
      representing: [MOCK_CASE.petitioners[0].contactId],
      serviceIndicator: SERVICE_INDICATOR_TYPES.SI_PAPER,
    },
  ],
};

const fakeClinicLetter = getFakeFile(true, true);

describe('setNoticesForCalendaredTrialSessionInteractor', () => {
  beforeAll(() => {
    applicationContext.getCurrentUser.mockReturnValue(user);
    applicationContext
      .getNotificationGateway()
      .sendNotificationToUser.mockReturnValue(null);
    applicationContext
      .getPersistenceGateway()
      .getCalendaredCasesForTrialSession.mockImplementation(
        () => calendaredCases,
      );
    applicationContext
      .getPersistenceGateway()
      .deleteCaseTrialSortMappingRecords.mockReturnValue(calendaredCases);
    applicationContext
      .getPersistenceGateway()
      .getDownloadPolicyUrl.mockReturnValue('http://example.com');
    applicationContext
      .getPersistenceGateway()
      .getTrialSessionById.mockImplementation(() => trialSession);
    applicationContext
      .getPersistenceGateway()
      .updateTrialSession.mockImplementation(({ trialSessionToUpdate }) => {
        trialSession = trialSessionToUpdate;
      });
    applicationContext
      .getPersistenceGateway()
      .updateCase.mockImplementation(({ caseToUpdate }) => {
        calendaredCases.some((caseRecord, index) => {
          if (caseRecord.docketNumber === caseToUpdate.docketNumber) {
            calendaredCases[index] = caseToUpdate;
            return true;
          }
        });
      });

    applicationContext
      .getUseCases()
      .generateNoticeOfTrialIssuedInteractor.mockReturnValue(testPdfDoc);
    applicationContext
      .getUseCases()
      .generateStandingPretrialOrderForSmallCaseInteractor.mockReturnValue(
        testPdfDoc,
      );
    applicationContext
      .getUseCases()
      .generateStandingPretrialOrderInteractor.mockReturnValue(testPdfDoc);
    applicationContext
      .getUseCaseHelpers()
      .savePaperServicePdf.mockReturnValue(serviceInfo);
    applicationContext
      .getPersistenceGateway()
      .getDocument.mockResolvedValue(fakeClinicLetter);
  });

  beforeEach(() => {
    calendaredCases = [case0, case1];
    trialSession = { ...MOCK_TRIAL };

    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockReturnValueOnce(case0)
      .mockReturnValueOnce(case0)
      .mockReturnValueOnce(case1)
      .mockReturnValueOnce(case1);
  });

  it('Should return an unauthorized error if the user does not have the TRIAL_SESSIONS permission', async () => {
    const mockUser = new User({
      name: PARTY_TYPES.petitioner,
      role: ROLES.petitioner, // Petitioners do not have the TRIAL_SESSIONS role, per authorizationClientService.js
      userId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });
    applicationContext.getCurrentUser.mockReturnValueOnce(mockUser);
    let error;

    try {
      await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
        trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
  });

  it('Should return immediately if there are no calendared cases to be set', async () => {
    applicationContext
      .getPersistenceGateway()
      .getCalendaredCasesForTrialSession.mockReturnValueOnce([]); // returning no cases

    const result = await setNoticesForCalendaredTrialSessionInteractor(
      applicationContext,
      {
        trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
      },
    );

    expect(
      applicationContext.getUseCases().generateNoticeOfTrialIssuedInteractor,
    ).not.toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway().saveDocumentFromLambda,
    ).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('Should generate a Notice of Trial for each case', async () => {
    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });

    expect(
      applicationContext.getUseCases().generateNoticeOfTrialIssuedInteractor,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway().saveDocumentFromLambda,
    ).toHaveBeenCalled();
    expect(findNoticeOfTrialDocketEntry(calendaredCases[0])).toBeTruthy();
    expect(findNoticeOfTrialDocketEntry(calendaredCases[1])).toBeTruthy();
  });

  it('Should include the signedAt field on the Notice of Trial document', async () => {
    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });

    expect(
      findNoticeOfTrialDocketEntry(calendaredCases[0]).signedAt,
    ).toBeTruthy();
    expect(
      findNoticeOfTrialDocketEntry(calendaredCases[1]).signedAt,
    ).toBeTruthy();
  });

  it('Should set the noticeOfTrialDate field on each case', async () => {
    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });

    expect(calendaredCases[0]).toHaveProperty('noticeOfTrialDate');
    expect(calendaredCases[1]).toHaveProperty('noticeOfTrialDate');
  });

  it('Should create a docket entry for each case', async () => {
    const mockNumberOfPages = 999;
    applicationContext
      .getUseCaseHelpers()
      .countPagesInDocument.mockReturnValue(mockNumberOfPages);

    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });

    expect(
      applicationContext.getUseCaseHelpers().countPagesInDocument,
    ).toHaveBeenCalled();
    expect(findNoticeOfTrialDocketEntry(calendaredCases[0])).toMatchObject({
      date: '2025-12-01T00:00:00.000Z',
      index: expect.anything(),
      isFileAttached: true,
      isOnDocketRecord: true,
      numberOfPages: 999,
      trialLocation: 'Birmingham, Alabama',
    });
    expect(findNoticeOfTrialDocketEntry(calendaredCases[1])).toMatchObject({
      date: '2025-12-01T00:00:00.000Z',
      index: expect.anything(),
      isFileAttached: true,
      isOnDocketRecord: true,
      numberOfPages: 999,
      trialLocation: 'Birmingham, Alabama',
    });
  });

  it('Should set the status of the Notice of Trial as served for each case', async () => {
    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });

    expect(
      applicationContext.getUseCases().generateNoticeOfTrialIssuedInteractor,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway().saveDocumentFromLambda,
    ).toHaveBeenCalled();
    expect(
      findNoticeOfTrialDocketEntry(calendaredCases[0]).servedAt,
    ).toBeDefined();
    expect(
      findNoticeOfTrialDocketEntry(calendaredCases[1]).servedAt,
    ).toBeDefined();
  });

  it('Should set the servedAt field for the Notice of Trial for each case', async () => {
    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });

    expect(
      applicationContext.getUseCases().generateNoticeOfTrialIssuedInteractor,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway().saveDocumentFromLambda,
    ).toHaveBeenCalled();
    expect(
      findNoticeOfTrialDocketEntry(calendaredCases[0]).servedAt,
    ).toBeTruthy();
    expect(
      findNoticeOfTrialDocketEntry(calendaredCases[1]).servedAt,
    ).toBeTruthy();
  });

  it('Should set the servedParties field for the Notice of Trial for each case', async () => {
    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });

    expect(
      applicationContext.getUseCases().generateNoticeOfTrialIssuedInteractor,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway().saveDocumentFromLambda,
    ).toHaveBeenCalled();
    expect(
      findNoticeOfTrialDocketEntry(calendaredCases[0]).servedParties.length,
    ).toBeGreaterThan(0);
    expect(
      findNoticeOfTrialDocketEntry(calendaredCases[1]).servedParties.length,
    ).toBeGreaterThan(0);
  });

  it('Should dispatch a service email for parties receiving electronic service', async () => {
    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });

    expect(
      applicationContext.getUseCaseHelpers().sendServedPartiesEmails,
    ).toHaveBeenCalled();
  });

  it('Should set the noticeIssuedDate on the trial session and then call updateTrialSession', async () => {
    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });

    expect(trialSession.noticeIssuedDate).toBeTruthy();
    expect(
      applicationContext.getPersistenceGateway().updateTrialSession,
    ).toHaveBeenCalled();
  });

  it('Should NOT overwrite the noticeIssuedDate on the trial session NOR call updateTrialSession if a docketNumber is set', async () => {
    const oldDate = '2019-12-01T00:00:00.000Z';
    trialSession.noticeIssuedDate = oldDate;

    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      docketNumber: '102-20',
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });

    expect(trialSession.noticeIssuedDate).toEqual(oldDate); // Should not be updated
    expect(
      applicationContext.getPersistenceGateway().updateTrialSession,
    ).not.toHaveBeenCalled();
  });

  it('Should only generate a Notice of Trial for a single case if a docketNumber is set', async () => {
    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      docketNumber: '103-20',
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });

    expect(
      applicationContext.getUseCases().generateNoticeOfTrialIssuedInteractor,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway().saveDocumentFromLambda,
    ).toHaveBeenCalled();
    expect(findNoticeOfTrialDocketEntry(calendaredCases[0])).toBeFalsy();
    expect(findNoticeOfTrialDocketEntry(calendaredCases[1])).toBeTruthy();
  });

  it('Should only set the notice for a single case if a docketNumber is set', async () => {
    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      docketNumber: '102-20',
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });

    expect(calendaredCases[0]).toHaveProperty('noticeOfTrialDate');
    expect(calendaredCases[1]).not.toHaveProperty('noticeOfTrialDate');
  });

  it('Should only create a docket entry for a single case if a docketNumber is set', async () => {
    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      docketNumber: '103-20',
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });

    expect(findNoticeOfTrialDocketEntry(calendaredCases[0])).toBeFalsy();
    expect(findNoticeOfTrialDocketEntry(calendaredCases[1])).toBeTruthy();
  });

  it('Should set the status of the Notice of Trial as served for a single case if a docketNumber is set', async () => {
    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockReset()
      .mockReturnValueOnce(calendaredCases[1])
      .mockReturnValueOnce(calendaredCases[1]);

    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      docketNumber: '103-20',
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });

    expect(
      applicationContext.getUseCases().generateNoticeOfTrialIssuedInteractor,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway().saveDocumentFromLambda,
    ).toHaveBeenCalled();
    expect(findNoticeOfTrialDocketEntry(calendaredCases[0])).toBeFalsy(); // Document should not exist on this case
    expect(
      findNoticeOfTrialDocketEntry(calendaredCases[1]).servedAt,
    ).toBeDefined();
  });

  it('should append a clinic letter to the docket record NTD when one exists, and a petitioner on the case is pro se', async () => {
    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockReset()
      .mockReturnValueOnce(calendaredCases[0])
      .mockReturnValueOnce(calendaredCases[0])
      .mockReturnValueOnce(calendaredCases[1])
      .mockReturnValueOnce(calendaredCases[1]);

    applicationContext
      .getPersistenceGateway()
      .isFileExists.mockReturnValue(true);

    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });

    expect(
      applicationContext.getPersistenceGateway().isFileExists,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway().getDocument,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getUtilities().combineTwoPdfs.mock.calls[0][0],
    ).toMatchObject({
      firstPdf: testPdfDoc,
      secondPdf: fakeClinicLetter,
    });
  });

  it('should NOT append a clinic letter to the docket record NTD when one exists, but there are no pro se petitioners on the case', async () => {
    applicationContext
      .getPersistenceGateway()
      .isFileExists.mockReturnValue(true);

    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockReset()
      .mockReturnValueOnce(caseWithNoProSePetitioner)
      .mockReturnValueOnce(caseWithNoProSePetitioner)
      .mockReturnValueOnce(caseWithNoProSePetitioner)
      .mockReturnValueOnce(caseWithNoProSePetitioner);

    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });

    expect(
      applicationContext.getPersistenceGateway().isFileExists,
    ).not.toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway().getDocument,
    ).not.toHaveBeenCalled();
    expect(
      applicationContext.getUtilities().combineTwoPdfs,
    ).not.toHaveBeenCalled();
  });

  it('should fetch the clinic letter correctly when it exists when party is not represented', async () => {
    const smallCase = {
      ...calendaredCases[0],
      procedureType: 'Small',
    };
    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockReset()
      .mockReturnValueOnce(calendaredCases[0])
      .mockReturnValueOnce(calendaredCases[0])
      .mockReturnValueOnce(smallCase)
      .mockReturnValueOnce(smallCase);

    applicationContext
      .getPersistenceGateway()
      .isFileExists.mockResolvedValue(true);

    await setNoticesForCalendaredTrialSessionInteractor(applicationContext, {
      trialSessionId: '6805d1ab-18d0-43ec-bafb-654e83405416',
    });
    expect(
      applicationContext.getPersistenceGateway().getDocument.mock.calls[0][0]
        .key,
    ).toEqual('clinic-letter-birmingham-alabama-regular');
    expect(
      applicationContext.getPersistenceGateway().getDocument.mock.calls[1][0]
        .key,
    ).toEqual('clinic-letter-birmingham-alabama-small');
  });
});
