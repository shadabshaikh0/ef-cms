const {
  generatePrintableFilingReceiptInteractor,
} = require('./generatePrintableFilingReceiptInteractor');
const { applicationContext } = require('../test/createTestApplicationContext');
const { MOCK_CASE } = require('../../test/mockCase');
const { MOCK_USERS } = require('../../test/mockUsers');

describe('generatePrintableFilingReceiptInteractor', () => {
  const mockPrimaryDocumentId = MOCK_CASE.documents[0].documentId;

  beforeAll(() => {
    applicationContext.getCurrentUser.mockReturnValue(
      MOCK_USERS['a7d90c05-f6cd-442c-a168-202db587f16f'],
    );
    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockReturnValue(MOCK_CASE);
    applicationContext
      .getPersistenceGateway()
      .getDownloadPolicyUrl.mockReturnValue({
        url: 'example.com/download-this',
      });
  });

  it('should call the Receipt of Filing document generator', async () => {
    await generatePrintableFilingReceiptInteractor({
      applicationContext,
      docketNumber: MOCK_CASE.docketNumber,
      documentsFiled: {
        primaryDocumentFile: {
          documentId: mockPrimaryDocumentId,
        },
      },
    });

    expect(
      applicationContext.getDocumentGenerators().receiptOfFiling,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway().saveDocumentFromLambda,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway().getDownloadPolicyUrl,
    ).toHaveBeenCalled();
  });

  it.only('should add a filedBy tot he primary document to file', async () => {
    await generatePrintableFilingReceiptInteractor({
      applicationContext,
      docketNumber: MOCK_CASE.docketNumber,
      documentsFiled: {
        hasSecondarySupportingDocuments: true,
        hasSupportingDocuments: true,
        primaryDocumentFile: {
          documentId: mockPrimaryDocumentId,
        },
        //fixme make this be primaryDocumentId
        secondaryDocument: { documentId: 4 },
        secondaryDocumentFile: { fakeDocument: true },
        secondarySupportingDocuments: [
          { documentId: '3' },
          { documentId: '7' },
        ],
        supportingDocuments: [{ documentId: '1' }, { documentId: '2' }],
      },
    });

    const receiptMockCall = applicationContext.getDocumentGenerators()
      .receiptOfFiling.mock.calls[0][0].data; // 'data' property of first arg (an object) of first call
    expect(receiptMockCall.primaryDocument.filedBy).toBe(
      MOCK_CASE.contactPrimary.name,
    );
  });

  it('acquires document information', async () => {
    await generatePrintableFilingReceiptInteractor({
      applicationContext,
      docketNumber: MOCK_CASE.docketNumber,
      documentsFiled: {
        hasSecondarySupportingDocuments: true,
        hasSupportingDocuments: true,
        primaryDocumentFile: {
          documentId: mockPrimaryDocumentId,
        },
        secondaryDocument: { documentId: 4 },
        secondaryDocumentFile: { fakeDocument: true },
        secondarySupportingDocuments: [
          { documentId: '3' },
          { documentId: '7' },
        ],
        supportingDocuments: [{ documentId: '1' }, { documentId: '2' }],
      },
    });

    const receiptMockCall = applicationContext.getDocumentGenerators()
      .receiptOfFiling.mock.calls[0][0].data; // 'data' property of first arg (an object) of first call
    expect(receiptMockCall.supportingDocuments.length).toBe(2);
    expect(receiptMockCall.secondarySupportingDocuments.length).toBe(2);
    expect(receiptMockCall.secondaryDocument).toBeDefined();
  });
});
