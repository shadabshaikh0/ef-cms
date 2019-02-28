import { state } from 'cerebral';
import { set } from 'cerebral/factories';

import { clearAlertsAction } from '../actions/clearAlertsAction';
import clearForm from '../actions/clearFormAction';
import prepareForm from '../actions/prepareFormAction';
import clearPetition from '../actions/clearPetitionAction';
import getCaseTypes from '../actions/getCaseTypesAction';
import getFilingTypes from '../actions/getFilingTypesAction';
import setFilingTypes from '../actions/setFilingTypesAction';
import getProcedureTypes from '../actions/getProcedureTypesAction';
import setCaseTypes from '../actions/setCaseTypesAction';
import setCurrentPage from '../actions/setCurrentPageAction';
import setProcedureTypes from '../actions/setProcedureTypesAction';

export default [
  clearAlertsAction,
  clearPetition,
  clearForm,
  prepareForm,
  set(state.showValidation, false),
  getCaseTypes,
  setCaseTypes,
  getFilingTypes,
  setFilingTypes,
  getProcedureTypes,
  setProcedureTypes,
  setCurrentPage('StartCase'),
];