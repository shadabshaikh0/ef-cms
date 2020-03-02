import { presenter } from '../presenter';
import { runAction } from 'cerebral/test';
import { shouldRefreshCaseAction } from './shouldRefreshCaseAction';

describe('shouldRefreshCaseAction', () => {
  let pathYesStub;
  let pathNoStub;

  beforeEach(() => {
    pathYesStub = jest.fn();
    pathNoStub = jest.fn();

    presenter.providers.path = {
      no: pathNoStub,
      yes: pathYesStub,
    };
  });

  it('returns the no path if no caseDetail already set', async () => {
    runAction(shouldRefreshCaseAction, {
      modules: {
        presenter,
      },
      state: {},
    });
    expect(pathNoStub).toHaveBeenCalled();
  });

  it('returns the yes path if caseDetail is set', async () => {
    runAction(shouldRefreshCaseAction, {
      modules: {
        presenter,
      },
      state: {
        caseDetail: {
          docketNumber: '101-19',
        },
      },
    });
    expect(pathYesStub).toHaveBeenCalled();
  });

  it('returns the yes path if caseDetail is set', async () => {
    runAction(shouldRefreshCaseAction, {
      modules: {
        presenter,
      },
      props: {
        docketNumber: '101-19',
      },
      state: {},
    });
    expect(pathYesStub).toHaveBeenCalled();
  });
});
