import { clearAlertsAction } from '../actions/clearAlertsAction';
import { clearModalStateAction } from '../actions/clearModalStateAction';
import { getPractitionersBySearchKeyAction } from '../actions/ManualAssociation/getPractitionersBySearchKeyAction';
import { set } from 'cerebral/factories';
import { setPractitionersAction } from '../actions/ManualAssociation/setPractitionersAction';
import { setValidationErrorsAction } from '../actions/setValidationErrorsAction';
import { state } from 'cerebral';

export const openAddPractitionerModalSequence = [
  clearAlertsAction,
  clearModalStateAction,
  getPractitionersBySearchKeyAction,
  {
    error: [setValidationErrorsAction],
    success: [
      setPractitionersAction,
      set(state.showModal, 'AddPractitionerModal'),
    ],
  },
];