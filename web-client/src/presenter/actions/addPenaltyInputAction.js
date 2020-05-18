import { state } from 'cerebral';

/**
 * adds a penalty input to the modal penalties array
 *
 * @param {object} providers the providers object
 * @param {object} providers.get the cerebral get function
 * @param {object} providers.store the cerebral store object
 * @returns {void}
 */
export const addPenaltyInputAction = ({ get, store }) => {
  const penalties = get(state.modal.meta.penalties) || [];
  penalties.push('');

  store.set(state.modal.meta.penalties, penalties);
};
