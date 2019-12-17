module.exports = {
  deleteCaseNoteLambda: require('./caseNote/deleteCaseNoteLambda').handler,
  deleteProceduralNoteLambda: require('./proceduralNote/deleteProceduralNoteLambda'),
  getCaseNoteLambda: require('./caseNote/getCaseNoteLambda').handler,
  saveProceduralNoteLambda: require('./proceduralNote/saveProceduralNoteLambda')
    .handler,
  updateCaseNoteLambda: require('./caseNote/updateCaseNoteLambda').handler,
};
