import { state } from 'cerebral';

/**
 * sets the correspondence id to display
 *
 * @param {object} providers the providers object
 * @param {object} providers.props the cerebral props object
 * @param {Function} providers.store the cerebral store object
 * @returns {Promise} async action
 */
export const setCorrespondenceIdToDisplayAction = async ({ props, store }) => {
  store.set(state.correspondenceDocumentId, props.correspondenceId);
};
