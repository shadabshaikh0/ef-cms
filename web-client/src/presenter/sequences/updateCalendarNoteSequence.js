import { clearAlertsAction } from '../actions/clearAlertsAction';
import { clearModalAction } from '../actions/clearModalAction';
import { clearModalStateAction } from '../actions/clearModalStateAction';
import { saveCalendarNoteAction } from '../actions/TrialSession/saveCalendarNoteAction';
import { setAlertSuccessAction } from '../actions/setAlertSuccessAction';
import { setValidationErrorsAction } from '../actions/setValidationErrorsAction';
import { showProgressSequenceDecorator } from '../utilities/sequenceHelpers';
import { validateCalendarNoteAction } from '../actions/validateCalendarNoteAction';

export const updateCalendarNoteSequence = [
  validateCalendarNoteAction,
  {
    error: [setValidationErrorsAction],
    success: showProgressSequenceDecorator([
      clearAlertsAction,
      saveCalendarNoteAction,
      setAlertSuccessAction,
      clearModalAction,
      clearModalStateAction,
    ]),
  },
];
