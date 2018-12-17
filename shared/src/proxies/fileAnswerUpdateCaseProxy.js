const axios = require('axios');

exports.fileAnswerUpdateCase = async ({
  applicationContext,
  caseToUpdate,
  userId,
}) => {
  const userToken = userId;
  const response = await axios.put(
    `${applicationContext.getBaseUrl()}/cases/${
      caseToUpdate.caseId
    }?interactorName=fileAnswerUpdateCase`, // TODO: Refactor to use axios params if possible
    caseToUpdate,
    {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    },
  );
  return response.data;
};
