const client = require('../../dynamodbClientService');
const {
  applicationContext,
} = require('../../../business/test/createTestApplicationContext');
const {
  CASE_STATUS_TYPES,
  DOCKET_NUMBER_SUFFIXES,
} = require('../../../business/entities/EntityConstants');
const { MOCK_DOCUMENTS } = require('../../../test/mockDocuments');
const { updateCase } = require('./updateCase');
jest.mock('../messages/updateMessage');
const { updateMessage } = require('../messages/updateMessage');
jest.mock('../caseDeadlines/getCaseDeadlinesByDocketNumber');
const {
  getCaseDeadlinesByDocketNumber,
} = require('../caseDeadlines/getCaseDeadlinesByDocketNumber');
jest.mock('../caseDeadlines/createCaseDeadline');
const { createCaseDeadline } = require('../caseDeadlines/createCaseDeadline');

describe('updateCase', () => {
  const mockCorrespondenceId = applicationContext.getUniqueId();
  const mockCaseDeadline = {
    associatedJudge: 'Judge Carluzzo',
    caseDeadlineId: 'a37f712d-bb9c-4885-8d35-7b67b908a5aa',
    deadlineDate: '2019-03-01T21:42:29.073Z',
    description: 'hello world',
    docketNumber: '101-18',
  };

  let caseQueryMockData;
  let caseMappingsQueryMockData;

  let mockCase;

  beforeEach(() => {
    caseQueryMockData = [
      {
        docketNumberSuffix: null,
        inProgress: false,
        pk: 'case|101-18',
        sk: 'case|101-18',
        status: CASE_STATUS_TYPES.generalDocket,
      },
    ];

    caseMappingsQueryMockData = [
      {
        gsi1pk: 'user-case|101-18',
        leadDocketNumber: '123-20',
        pk: 'user|123',
        sk: 'case|101-18',
        status: CASE_STATUS_TYPES.generalDocket,
      },
    ];

    applicationContext.getDocumentClient().put.mockReturnValue({
      promise: async () => null,
    });

    applicationContext.getDocumentClient().delete.mockReturnValue({
      promise: async () => null,
    });

    applicationContext
      .getDocumentClient()
      .query.mockReturnValueOnce(caseQueryMockData)
      .mockReturnValueOnce(caseMappingsQueryMockData)
      .mockReturnValue([
        {
          sk: '123',
        },
      ]);

    client.query = applicationContext.getDocumentClient().query;

    mockCase = {
      docketNumberSuffix: null,
      inProgress: false,
      irsPractitioners: [],
      pk: 'case|101-18',
      privatePractitioners: [],
      sk: 'case|101-18',
      status: 'General Docket - Not at Issue',
    };

    getCaseDeadlinesByDocketNumber.mockReturnValue([mockCaseDeadline]);
  });

  /**
   * Adds mock private practitioners to test fixture
   */
  function addPrivatePractitioners() {
    caseQueryMockData.push({
      name: 'Guy Fieri',
      pk: 'case|101-18',
      sk: 'privatePractitioner|user-id-existing-123',
      userId: 'user-id-existing-123',
    });
    caseQueryMockData.push({
      name: 'Rachel Ray',
      pk: 'case|101-18',
      sk: 'privatePractitioner|user-id-existing-234',
      userId: 'user-id-existing-234',
    });
  }

  /**
   * Adds mock archived correspondences to test fixture
   */
  function addArchivedCorrespondences() {
    caseQueryMockData.push({
      archived: true,
      correspondenceId: 'archived-correspondence-id-existing-123',
      documentTitle: 'My Correspondence',
      filedBy: 'Docket clerk',
      pk: 'case|101-18',
      sk: 'correspondence|archived-correspondence-id-existing-123',
      userId: 'user-id-existing-234',
    });
    caseQueryMockData.push({
      archived: true,
      correspondenceId: mockCorrespondenceId,
      documentTitle: 'My Correspondence',
      filedBy: 'Docket clerk',
      pk: 'case|101-18',
      sk: 'correspondence|archived-correspondence-id-456',
      userId: 'user-id-existing-234',
    });
  }

  /**
   * Adds mock documents to test fixture
   */
  function addDocuments() {
    caseQueryMockData.push({
      ...MOCK_DOCUMENTS[0],
      pk: 'case|101-18',
      sk: 'docket-entry|a-document-id-123',
    });
    caseQueryMockData.push({
      ...MOCK_DOCUMENTS[1],
      pk: 'case|101-18',
      sk: 'docket-entry|a-document-id-456',
    });
  }

  /**
   * Adds mock hearings to test fixture
   */
  function addHearing() {
    caseQueryMockData.push({
      ...{
        maxCases: 100,
        sessionType: 'Regular',
        startDate: '3000-03-01T00:00:00.000Z',
        term: 'Fall',
        termYear: '3000',
        trialLocation: 'Birmingham, Alabama',
        trialSessionId: '208a959f-9526-4db5-b262-e58c476a4604',
      },
      pk: 'case|101-18',
      sk: 'hearing|a-document-id-123',
    });
  }

  it('updates case', async () => {
    await updateCase({
      applicationContext,
      caseToUpdate: {
        docketNumber: '101-18',
        docketNumberSuffix: null,
        status: CASE_STATUS_TYPES.generalDocket,
        userId: 'petitioner',
      },
    });

    expect(
      applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
    ).toMatchObject({
      pk: 'case|101-18',
      sk: 'case|101-18',
    });
  });

  it('should remove fields not stored on main case record in persistence', async () => {
    await updateCase({
      applicationContext,
      caseToUpdate: {
        archivedCorrespondences: [{}],
        archivedDocketEntries: [{}],
        correspondence: [{}],
        docketEntries: [{}],
        docketNumber: '101-18',
        docketNumberSuffix: null,
        hearings: [{}],
        irsPractitioners: [{}],
        privatePractitioners: [{}],
        status: CASE_STATUS_TYPES.generalDocket,
        userId: 'petitioner',
      },
    });

    const caseUpdateCall = applicationContext
      .getDocumentClient()
      .put.mock.calls.find(
        x =>
          x[0].Item.pk &&
          x[0].Item.pk.startsWith('case|') &&
          x[0].Item.sk.startsWith('case|'),
      );
    expect(caseUpdateCall[0].Item).toEqual({
      docketNumber: '101-18',
      docketNumberSuffix: null,
      pk: 'case|101-18',
      sk: 'case|101-18',
      status: CASE_STATUS_TYPES.generalDocket,
      userId: 'petitioner',
    });
  });

  it('updates fields on work items', async () => {
    await updateCase({
      applicationContext,
      caseToUpdate: {
        associatedJudge: 'Judge Buch',
        caseCaption: 'Johnny Joe Jacobson, Petitioner',
        docketNumber: '101-18',
        docketNumberSuffix: DOCKET_NUMBER_SUFFIXES.WHISTLEBLOWER,
        inProgress: true,
        status: CASE_STATUS_TYPES.calendared,
        trialDate: '2019-03-01T21:40:46.415Z',
        userId: 'petitioner',
      },
    });

    expect(
      applicationContext.getDocumentClient().put.mock.calls[1][0].Item,
    ).toMatchObject({
      pk: 'case|101-18',
      sk: 'case|101-18',
    });
    expect(
      applicationContext.getDocumentClient().update.mock.calls[0][0],
    ).toMatchObject({
      ExpressionAttributeValues: {
        ':caseStatus': CASE_STATUS_TYPES.calendared,
      },
    });
    expect(
      applicationContext.getDocumentClient().update.mock.calls[1][0],
    ).toMatchObject({
      ExpressionAttributeValues: {
        ':caseTitle': 'Johnny Joe Jacobson',
      },
    });
    expect(
      applicationContext.getDocumentClient().update.mock.calls[2][0],
    ).toMatchObject({
      ExpressionAttributeValues: {
        ':docketNumberSuffix': DOCKET_NUMBER_SUFFIXES.WHISTLEBLOWER,
      },
    });
    expect(
      applicationContext.getDocumentClient().update.mock.calls[3][0],
    ).toMatchObject({
      ExpressionAttributeValues: {
        ':trialDate': '2019-03-01T21:40:46.415Z',
      },
    });
    expect(
      applicationContext.getDocumentClient().update.mock.calls[4][0],
    ).toMatchObject({
      ExpressionAttributeValues: {
        ':associatedJudge': 'Judge Buch',
      },
    });
    expect(
      applicationContext.getDocumentClient().update.mock.calls[5][0],
    ).toMatchObject({
      ExpressionAttributeValues: {
        ':caseIsInProgress': true,
      },
    });
  });

  it('updates fields on case messages', async () => {
    await updateCase({
      applicationContext,
      caseToUpdate: {
        associatedJudge: 'Judge Buch',
        caseCaption: 'Johnny Joe Jacobson, Petitioner',
        docketNumber: '101-18',
        docketNumberSuffix: DOCKET_NUMBER_SUFFIXES.WHISTLEBLOWER,
        inProgress: true,
        status: CASE_STATUS_TYPES.calendared,
        trialDate: '2019-03-01T21:40:46.415Z',
        userId: 'petitioner',
      },
    });

    expect(updateMessage).toHaveBeenCalled();
    expect(updateMessage.mock.calls[0][0].message).toEqual({
      caseStatus: 'Calendared',
      caseTitle: 'Johnny Joe Jacobson',
      docketNumberSuffix: 'W',
      sk: '123',
    });
  });

  it('updates associated judge on case deadlines', async () => {
    await updateCase({
      applicationContext,
      caseToUpdate: {
        associatedJudge: 'Judge Buch',
        docketNumberSuffix: null,
        status: CASE_STATUS_TYPES.generalDocket,
      },
    });

    expect(createCaseDeadline).toHaveBeenCalled();
    expect(createCaseDeadline.mock.calls[0][0].caseDeadline).toMatchObject({
      ...mockCaseDeadline,
      associatedJudge: 'Judge Buch',
    });
  });

  it('updates associated judge on work items', async () => {
    await updateCase({
      applicationContext,
      caseToUpdate: {
        associatedJudge: 'Judge Buch',
        docketNumberSuffix: null,
        status: CASE_STATUS_TYPES.generalDocket,
      },
    });

    expect(
      applicationContext.getDocumentClient().update.mock.calls[0][0],
    ).toMatchObject({
      ExpressionAttributeValues: {
        ':associatedJudge': 'Judge Buch',
      },
    });
  });

  it('does not update work items if work item fields are unchanged', async () => {
    await updateCase({
      applicationContext,
      caseToUpdate: {
        docketNumber: '101-18',
        docketNumberSuffix: null,
        status: CASE_STATUS_TYPES.generalDocket,
      },
    });

    expect(
      applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
    ).toMatchObject({
      pk: 'case|101-18',
      sk: 'case|101-18',
    });
    expect(applicationContext.getDocumentClient().update).not.toBeCalled();
  });

  describe('irsPractitioners', () => {
    it('adds a irsPractitioner to a case with no existing irsPractitioners', async () => {
      await updateCase({
        applicationContext,
        caseToUpdate: {
          docketNumber: '101-18',
          docketNumberSuffix: null,
          irsPractitioners: [
            { name: 'Guy Fieri', userId: 'user-id-existing-234' },
          ],
          status: CASE_STATUS_TYPES.generalDocket,
        },
      });

      expect(
        applicationContext.getDocumentClient().delete,
      ).not.toHaveBeenCalled();
      expect(applicationContext.getDocumentClient().put).toHaveBeenCalled();
      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        pk: 'case|101-18',
        sk: 'irsPractitioner|user-id-existing-234',
        userId: 'user-id-existing-234',
      });
    });

    it('adds an irsPractitioner to a case with existing irsPractitioners', async () => {
      await updateCase({
        applicationContext,
        caseToUpdate: {
          docketNumber: '101-18',
          docketNumberSuffix: null,
          irsPractitioners: [
            {
              name: 'Bobby Flay',
              userId: 'user-id-new-321',
            },
            { name: 'Guy Fieri', userId: 'user-id-existing-123' },
            { name: 'Rachel Ray', userId: 'user-id-existing-234' },
          ],
          status: CASE_STATUS_TYPES.generalDocket,
        },
      });

      expect(
        applicationContext.getDocumentClient().delete,
      ).not.toHaveBeenCalled();
      expect(applicationContext.getDocumentClient().put).toHaveBeenCalled();
      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        pk: 'case|101-18',
        sk: 'irsPractitioner|user-id-new-321',
        userId: 'user-id-new-321',
      });
    });

    it('updates a irsPractitioner on a case', async () => {
      caseQueryMockData.push({
        name: 'Guy Fieri',
        pk: 'case|101-18',
        sk: 'irsPractitioner|user-id-existing-123',
        userId: 'user-id-existing-123',
      });
      caseQueryMockData.push({
        name: 'Rachel Ray',
        pk: 'case|101-18',
        sk: 'irsPractitioner|user-id-existing-234',
        userId: 'user-id-existing-234',
      });

      await updateCase({
        applicationContext,
        caseToUpdate: {
          docketNumber: '101-18',
          docketNumberSuffix: null,
          irsPractitioners: [
            {
              motto: 'Welcome to Flavortown!',
              name: 'Guy Fieri',
              userId: 'user-id-existing-123',
            },
            { name: 'Rachel Ray', userId: 'user-id-existing-234' },
          ],
          status: CASE_STATUS_TYPES.generalDocket,
        },
      });
      expect(
        applicationContext.getDocumentClient().delete,
      ).not.toHaveBeenCalled();
      expect(applicationContext.getDocumentClient().put).toHaveBeenCalled();
      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        motto: 'Welcome to Flavortown!',
        pk: 'case|101-18',
        sk: 'irsPractitioner|user-id-existing-123',
        userId: 'user-id-existing-123',
      });
    });

    it('removes an irsPractitioner from a case with existing irsPractitioners', async () => {
      caseQueryMockData.push({
        name: 'Guy Fieri',
        pk: 'case|101-18',
        sk: 'irsPractitioner|user-id-existing-123',
        userId: 'user-id-existing-123',
      });
      caseQueryMockData.push({
        name: 'Rachel Ray',
        pk: 'case|101-18',
        sk: 'irsPractitioner|user-id-existing-234',
        userId: 'user-id-existing-234',
      });

      await updateCase({
        applicationContext,
        caseToUpdate: {
          docketNumber: '101-18',
          docketNumberSuffix: null,
          irsPractitioners: [
            {
              name: 'Rachel Ray',
              userId: 'user-id-existing-234',
            },
          ],
          status: CASE_STATUS_TYPES.generalDocket,
        },
      });

      expect(applicationContext.getDocumentClient().delete).toHaveBeenCalled();
      expect(
        applicationContext.getDocumentClient().put.mock.calls.length,
      ).toEqual(1);
      expect(
        applicationContext.getDocumentClient().delete.mock.calls[0][0].Key,
      ).toMatchObject({
        pk: 'case|101-18',
        sk: 'irsPractitioner|user-id-existing-123',
      });
    });
  });

  describe('privatePractitioners', () => {
    it('adds a privatePractitioner to a case with no existing privatePractitioners', async () => {
      await updateCase({
        applicationContext,
        caseToUpdate: {
          docketNumber: '101-18',
          docketNumberSuffix: null,
          privatePractitioners: [
            { name: 'Guy Fieri', userId: 'user-id-existing-234' },
          ],
          status: CASE_STATUS_TYPES.generalDocket,
        },
      });

      expect(
        applicationContext.getDocumentClient().delete,
      ).not.toHaveBeenCalled();
      expect(applicationContext.getDocumentClient().put).toHaveBeenCalled();
      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        pk: 'case|101-18',
        sk: 'privatePractitioner|user-id-existing-234',
        userId: 'user-id-existing-234',
      });
    });

    it('adds a privatePractitioner to a case with existing privatePractitioners', async () => {
      addPrivatePractitioners();

      await updateCase({
        applicationContext,
        caseToUpdate: {
          docketNumber: '101-18',
          docketNumberSuffix: null,
          privatePractitioners: [
            {
              name: 'Bobby Flay',
              userId: 'user-id-new-321',
            },
            { name: 'Guy Fieri', userId: 'user-id-existing-123' },
            { name: 'Rachel Ray', userId: 'user-id-existing-234' },
          ],
          status: CASE_STATUS_TYPES.generalDocket,
        },
      });

      expect(
        applicationContext.getDocumentClient().delete,
      ).not.toHaveBeenCalled();
      expect(applicationContext.getDocumentClient().put).toHaveBeenCalled();
      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        pk: 'case|101-18',
        sk: 'privatePractitioner|user-id-new-321',
        userId: 'user-id-new-321',
      });
    });

    it('updates a privatePractitioner on a case', async () => {
      addPrivatePractitioners();

      await updateCase({
        applicationContext,
        caseToUpdate: {
          docketNumber: '101-18',
          docketNumberSuffix: null,
          privatePractitioners: [
            {
              motto: 'Welcome to Flavortown!',
              name: 'Guy Fieri',
              userId: 'user-id-existing-123',
            },
            { name: 'Rachel Ray', userId: 'user-id-existing-234' },
          ],
          status: CASE_STATUS_TYPES.generalDocket,
        },
      });

      expect(
        applicationContext.getDocumentClient().delete,
      ).not.toHaveBeenCalled();
      expect(applicationContext.getDocumentClient().put).toHaveBeenCalled();
      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        motto: 'Welcome to Flavortown!',
        pk: 'case|101-18',
        sk: 'privatePractitioner|user-id-existing-123',
        userId: 'user-id-existing-123',
      });
    });

    it('removes a privatePractitioner from a case with existing privatePractitioners', async () => {
      addPrivatePractitioners();

      await updateCase({
        applicationContext,
        caseToUpdate: {
          docketNumber: '101-18',
          docketNumberSuffix: null,
          privatePractitioners: [
            { name: 'Rachel Ray', userId: 'user-id-existing-234' },
          ],
          status: CASE_STATUS_TYPES.generalDocket,
        },
      });

      expect(applicationContext.getDocumentClient().delete).toHaveBeenCalled();
      expect(
        applicationContext.getDocumentClient().delete.mock.calls.length,
      ).toEqual(1);
      expect(
        applicationContext.getDocumentClient().delete.mock.calls[0][0].Key,
      ).toMatchObject({
        pk: 'case|101-18',
        sk: 'privatePractitioner|user-id-existing-123',
      });
    });
  });

  describe('archivedCorrespondences', () => {
    it('adds an archived correspondence to a case when archivedCorrespondences is an empty list', async () => {
      applicationContext
        .getPersistenceGateway()
        .getCaseByDocketNumber.mockResolvedValue({
          ...mockCase,
          archivedCorrespondences: [],
        });

      await updateCase({
        applicationContext,
        caseToUpdate: {
          archivedCorrespondences: [
            {
              archived: true,
              correspondenceId: mockCorrespondenceId,
              documentTitle: 'My Correspondence',
              filedBy: 'Docket clerk',
              userId: 'user-id-existing-234',
            },
          ],
          docketNumber: '101-18',
          docketNumberSuffix: null,
          status: CASE_STATUS_TYPES.generalDocket,
        },
      });

      expect(
        applicationContext.getDocumentClient().delete,
      ).not.toHaveBeenCalled();
      expect(applicationContext.getDocumentClient().put).toHaveBeenCalled();
      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        pk: 'case|101-18',
        sk: `correspondence|${mockCorrespondenceId}`,
        userId: 'user-id-existing-234',
      });
    });

    it('adds an archived correspondence to a case when archivedCorrespondences has entries', async () => {
      addArchivedCorrespondences();

      await updateCase({
        applicationContext,
        caseToUpdate: {
          archivedCorrespondences: [
            {
              archived: true,
              correspondenceId: mockCorrespondenceId,
              documentTitle: 'My Correspondence',
              filedBy: 'Docket clerk',
              userId: 'user-id-existing-234',
            },
            {
              archived: true,
              correspondenceId: 'archived-correspondence-id-existing-123',
              documentTitle: 'My Correspondence',
              filedBy: 'Docket clerk',
              userId: 'user-id-existing-234',
            },
          ],
          docketNumber: '101-18',
          docketNumberSuffix: null,
          status: CASE_STATUS_TYPES.generalDocket,
        },
      });

      expect(
        applicationContext.getDocumentClient().delete,
      ).not.toHaveBeenCalled();
      expect(applicationContext.getDocumentClient().put).toHaveBeenCalled();
      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        pk: 'case|101-18',
        sk: `correspondence|${mockCorrespondenceId}`,
        userId: 'user-id-existing-234',
      });
    });
  });

  describe('correspondence', () => {
    it('adds a correspondence to a case when correspondence is an empty list', async () => {
      applicationContext
        .getPersistenceGateway()
        .getCaseByDocketNumber.mockResolvedValue({
          ...mockCase,
          correspondence: [],
        });

      await updateCase({
        applicationContext,
        caseToUpdate: {
          correspondence: [
            {
              archived: true,
              correspondenceId: mockCorrespondenceId,
              documentTitle: 'My Correspondence',
              filedBy: 'Docket clerk',
              userId: 'user-id-existing-234',
            },
          ],
          docketNumber: '101-18',
          docketNumberSuffix: null,
          status: CASE_STATUS_TYPES.generalDocket,
        },
      });

      expect(
        applicationContext.getDocumentClient().delete,
      ).not.toHaveBeenCalled();
      expect(applicationContext.getDocumentClient().put).toHaveBeenCalled();
      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        pk: 'case|101-18',
        sk: `correspondence|${mockCorrespondenceId}`,
        userId: 'user-id-existing-234',
      });
    });

    it('adds a correspondence to a case when correspondence has entries', async () => {
      addArchivedCorrespondences();

      await updateCase({
        applicationContext,
        caseToUpdate: {
          correspondence: [
            {
              archived: true,
              correspondenceId: mockCorrespondenceId,
              documentTitle: 'My Correspondence',
              filedBy: 'Docket clerk',
              userId: 'user-id-existing-234',
            },
            {
              archived: true,
              correspondenceId: 'archived-correspondence-id-existing-123',
              documentTitle: 'My Correspondence',
              filedBy: 'Docket clerk',
              userId: 'user-id-existing-234',
            },
          ],
          docketNumber: '101-18',
          docketNumberSuffix: null,
          status: CASE_STATUS_TYPES.generalDocket,
        },
      });

      expect(
        applicationContext.getDocumentClient().delete,
      ).not.toHaveBeenCalled();
      expect(applicationContext.getDocumentClient().put).toHaveBeenCalled();
      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        pk: 'case|101-18',
        sk: `correspondence|${mockCorrespondenceId}`,
        userId: 'user-id-existing-234',
      });
    });
  });

  describe('documents', () => {
    it('adds a document to a case when documents is an empty list', async () => {
      applicationContext
        .getPersistenceGateway()
        .getCaseByDocketNumber.mockResolvedValue({
          ...mockCase,
          docketEntries: [],
        });

      await updateCase({
        applicationContext,
        caseToUpdate: {
          docketEntries: [MOCK_DOCUMENTS[0]],
          docketNumber: '101-18',
          docketNumberSuffix: null,
          status: CASE_STATUS_TYPES.generalDocket,
        },
      });

      expect(
        applicationContext.getDocumentClient().delete,
      ).not.toHaveBeenCalled();
      expect(applicationContext.getDocumentClient().put).toHaveBeenCalled();
      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        pk: 'case|101-18',
        sk: `docket-entry|${MOCK_DOCUMENTS[0].docketEntryId}`,
        userId: MOCK_DOCUMENTS[0].userId,
      });
    });

    it('adds an archived correspondence to a case when archivedCorrespondences has entries', async () => {
      addDocuments();

      await updateCase({
        applicationContext,
        caseToUpdate: {
          docketEntries: [MOCK_DOCUMENTS[0], MOCK_DOCUMENTS[1]],
          docketNumber: '101-18',
          docketNumberSuffix: null,
          status: CASE_STATUS_TYPES.generalDocket,
        },
      });

      expect(
        applicationContext.getDocumentClient().delete,
      ).not.toHaveBeenCalled();
      expect(applicationContext.getDocumentClient().put).toHaveBeenCalled();
      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        pk: 'case|101-18',
        sk: `docket-entry|${MOCK_DOCUMENTS[0].docketEntryId}`,
        userId: MOCK_DOCUMENTS[0].userId,
      });
    });
  });

  describe('user case mappings', () => {
    beforeEach(() => {
      applicationContext.getDocumentClient().query = jest
        .fn()
        .mockResolvedValueOnce(caseQueryMockData) // getting case
        .mockResolvedValueOnce([]) // work item mappings
        .mockResolvedValue(caseMappingsQueryMockData);

      client.query = applicationContext.getDocumentClient().query;
    });

    it('updates user case mapping if the status has changed', async () => {
      await updateCase({
        applicationContext,
        caseToUpdate: {
          associatedJudge: 'Judge Buch',
          docketNumber: '101-18',
          docketNumberSuffix: null,
          inProgress: true,
          status: CASE_STATUS_TYPES.calendared,
          trialDate: '2019-03-01T21:40:46.415Z',
          userId: 'petitioner',
        },
      });

      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        gsi1pk: 'user-case|101-18',
        pk: 'user|123',
        sk: 'case|101-18',
        status: CASE_STATUS_TYPES.calendared,
      });
    });

    it('updates user case mapping if the docket number suffix has changed', async () => {
      await updateCase({
        applicationContext,
        caseToUpdate: {
          associatedJudge: 'Judge Buch',
          docketNumber: '101-18',
          docketNumberSuffix: DOCKET_NUMBER_SUFFIXES.WHISTLEBLOWER,
          inProgress: true,
          status: CASE_STATUS_TYPES.generalDocket,
          trialDate: '2019-03-01T21:40:46.415Z',
          userId: 'petitioner',
        },
      });

      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        docketNumberSuffix: DOCKET_NUMBER_SUFFIXES.WHISTLEBLOWER,
        gsi1pk: 'user-case|101-18',
        pk: 'user|123',
        sk: 'case|101-18',
      });
    });

    it('updates user case mapping if the case caption has changed', async () => {
      await updateCase({
        applicationContext,
        caseToUpdate: {
          associatedJudge: 'Judge Buch',
          caseCaption: 'Guy Fieri, Petitioner',
          docketNumber: '101-18',
          docketNumberSuffix: null,
          inProgress: true,
          status: CASE_STATUS_TYPES.generalDocket,
          trialDate: '2019-03-01T21:40:46.415Z',
          userId: 'petitioner',
        },
      });

      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        caseCaption: 'Guy Fieri, Petitioner',
        gsi1pk: 'user-case|101-18',
        pk: 'user|123',
        sk: 'case|101-18',
      });
    });

    it('updates user case mapping if the lead docket number (consolidation) has changed', async () => {
      await updateCase({
        applicationContext,
        caseToUpdate: {
          associatedJudge: 'Judge Buch',
          docketNumber: '101-18',
          docketNumberSuffix: null,
          inProgress: true,
          leadDocketNumber: '123-20',
          status: CASE_STATUS_TYPES.generalDocket,
          trialDate: '2019-03-01T21:40:46.415Z',
          userId: 'petitioner',
        },
      });

      expect(
        applicationContext.getDocumentClient().put.mock.calls[0][0].Item,
      ).toMatchObject({
        gsi1pk: 'user-case|101-18',
        leadDocketNumber: '123-20',
        pk: 'user|123',
        sk: 'case|101-18',
      });
    });
  });

  describe('hearings', () => {
    it('removes hearing from case if the updated case has none and the old case has one', async () => {
      addHearing();

      await updateCase({
        applicationContext,
        caseToUpdate: {
          docketNumber: '101-18',
          docketNumberSuffix: null,
          hearings: [],
          status: CASE_STATUS_TYPES.generalDocket,
        },
      });

      expect(applicationContext.getDocumentClient().delete).toHaveBeenCalled();
      expect(
        applicationContext.getDocumentClient().delete,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: {
            pk: 'case|101-18',
            sk: 'hearing|208a959f-9526-4db5-b262-e58c476a4604',
          },
        }),
      );
    });
  });
});
