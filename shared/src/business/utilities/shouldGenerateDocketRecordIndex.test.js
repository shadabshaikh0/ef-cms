import { shouldGenerateDocketRecordIndex } from './shouldGenerateDocketRecordIndex';

describe('shouldGenerateDocketRecordIndex', () => {
  it('returns false for any entry that already has an index', () => {
    const caseDetail = { documents: [] };
    const docketRecordEntry = {
      documentId: '123',
      index: 1,
    };

    const result = shouldGenerateDocketRecordIndex({
      caseDetail,
      docketRecordEntry,
    });

    expect(result).toEqual(false);
  });

  it('returns false for entries without a document', () => {
    // are there exceptions to this? entries without a document
    const caseDetail = { documents: [] };
    const docketRecordEntry = {
      documentType: 'Answer',
      eventCode: 'A',
    };

    const result = shouldGenerateDocketRecordIndex({
      caseDetail,
      docketRecordEntry,
    });

    expect(result).toEqual(false);
  });

  it('returns true for electronically filed documents', () => {
    const caseDetail = {
      documents: [
        {
          documentId: '123',
          isPaper: false,
          servedAt: '2019-03-01T21:40:46.415Z',
        },
      ],
    };
    const docketRecordEntry = {
      documentId: '123',
      documentType: 'Answer',
      eventCode: 'A',
    };
    const result = shouldGenerateDocketRecordIndex({
      caseDetail,
      docketRecordEntry,
    });

    expect(result).toEqual(true);
  });

  it('returns true for petition documents', () => {
    const caseDetail = {
      documents: [
        {
          documentId: '123',
          isPaper: true,
          servedAt: '2019-03-01T21:40:46.415Z',
        },
      ],
    };
    const docketRecordEntry = {
      documentId: '123',
      documentType: 'Petition',
      eventCode: 'P',
    };
    const result = shouldGenerateDocketRecordIndex({
      caseDetail,
      docketRecordEntry,
    });

    expect(result).toEqual(true);
  });

  it('returns true for initial document types filed along with the petition', () => {
    const caseDetail = {
      docketRecord: [
        {
          description: 'Petition',
          docketRecordId: '234',
          documentId: '123',
          eventCode: 'P',
          filingDate: '2019-03-01T21:40:46.415Z',
          index: 1,
        },
      ],
      documents: [
        {
          createdAt: '2019-03-01T21:40:46.415Z',
          documentId: '012',
          eventCode: 'P',
          isPaper: true,
        },
        {
          documentId: '123',
          isPaper: true,
        },
      ],
    };
    const docketRecordEntry = {
      documentId: '123',
      documentType: 'Ownership Disclosure Statement',
      eventCode: 'DISC',
      filingDate: '2019-03-01T21:40:56.415Z', // 10 seconds
    };
    const result = shouldGenerateDocketRecordIndex({
      caseDetail,
      docketRecordEntry,
    });

    expect(result).toEqual(true);
  });

  it('returns true for initial document types filed after the petition', () => {
    const caseDetail = {
      docketRecord: [
        {
          description: 'Petition',
          docketRecordId: '234',
          documentId: '123',
          eventCode: 'P',
          filingDate: '2019-03-01T21:40:46.415Z',
          index: 1,
        },
      ],
      documents: [
        {
          createdAt: '2019-03-01T21:40:46.415Z',
          documentId: '012',
          eventCode: 'P',
          isPaper: true,
        },
        {
          documentId: '123',
          isPaper: true,
        },
      ],
    };
    const docketRecordEntry = {
      documentId: '123',
      documentType: 'Ownership Disclosure Statement',
      eventCode: 'DISC',
      filingDate: '2019-03-01T21:40:57.415Z', // 11 seconds
    };
    const result = shouldGenerateDocketRecordIndex({
      caseDetail,
      docketRecordEntry,
    });

    expect(result).toEqual(false);
  });

  it('returns true for documents that are unservable', () => {
    const caseDetail = {
      documents: [
        {
          documentId: '123',
          isPaper: true,
        },
      ],
    };
    const docketRecordEntry = {
      documentId: '123',
      documentType: 'Hearing before',
      eventCode: 'HEAR',
    };

    const result = shouldGenerateDocketRecordIndex({
      caseDetail,
      docketRecordEntry,
    });

    expect(result).toEqual(true);
  });

  it('returns true for minute entries', () => {
    const caseDetail = {
      documents: [
        {
          documentId: '123',
          isPaper: true,
        },
      ],
    };
    const docketRecordEntry = {
      documentId: '123',
      documentType: 'Filing Fee Paid',
      eventCode: 'FEE',
    };

    const result = shouldGenerateDocketRecordIndex({
      caseDetail,
      docketRecordEntry,
    });

    expect(result).toEqual(true);
  });

  it('returns true for minute entries', () => {
    const caseDetail = { documents: [] };
    const docketRecordEntry = {
      documentId: '123',
      documentType: 'Filing Fee Paid',
      eventCode: 'FEE',
    };

    const result = shouldGenerateDocketRecordIndex({
      caseDetail,
      docketRecordEntry,
    });

    expect(result).toEqual(true);
  });

  it('returns false for servable documents that are not served', () => {
    const caseDetail = {
      documents: [{ documentId: '123', isPaper: true, servedAt: undefined }],
    };
    const docketRecordEntry = {
      documentId: '123',
      documentType: 'Answer',
      eventCode: 'A',
    };

    const result = shouldGenerateDocketRecordIndex({
      caseDetail,
      docketRecordEntry,
    });

    expect(result).toEqual(false);
  });

  it('returns true for servable documents that are served', () => {
    const caseDetail = {
      documents: [
        {
          documentId: '123',
          isPaper: true,
          servedAt: '2019-03-01T21:40:46.415Z',
        },
      ],
    };
    const docketRecordEntry = {
      documentId: '123',
      documentType: 'Answer',
      eventCode: 'A',
    };

    const result = shouldGenerateDocketRecordIndex({
      caseDetail,
      docketRecordEntry,
    });

    expect(result).toEqual(true);
  });
});
