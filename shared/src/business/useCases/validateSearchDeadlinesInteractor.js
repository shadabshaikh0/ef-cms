const { DeadlineSearch } = require('../entities/deadlines/DeadlineSearch');

/**
 * validateSearchDeadlinesInteractor
 *
 * @param {object} providers the providers object
 * @param {object} providers.orderSearch the order search to validate
 * @returns {object} errors (null if no errors)
 */
exports.validateSearchDeadlinesInteractor = ({
  applicationContext,
  deadlineSearch,
}) => {
  const search = new DeadlineSearch(deadlineSearch, {
    applicationContext,
  });

  return search.getFormattedValidationErrors();
};
