import { set } from 'cerebral/factories';
import { state } from 'cerebral';

import { clearAlertsAction } from '../actions/clearAlertsAction';
import { getFormCombinedWithCaseDetailAction } from '../actions/getFormCombinedWithCaseDetailAction';
import { setValidationAlertErrorsAction } from '../actions/setValidationAlertErrorsAction';
import { updateCaseAction } from '../actions/updateCaseAction';
import { validateCaseDetailAction } from '../actions/validateCaseDetailAction';

export const clickServeToIrsSequence = [
  clearAlertsAction,
  getFormCombinedWithCaseDetailAction,
  validateCaseDetailAction,
  {
    error: [setValidationAlertErrorsAction],
    success: [updateCaseAction, set(state.showModal, 'ServeToIrsModalDialog')],
  },
];
