const getUploadPolicy = async ({ applicationContext, key }) => {
  const response = await applicationContext
    .getHttpClient()
    .get(`${applicationContext.getBaseUrl()}/documents/${key}/upload-policy`, {
      headers: {
        Authorization: `Bearer ${applicationContext.getCurrentUserToken()}`,
      },
    });
  return response.data;
};

exports.uploadDocumentFromClient = async ({
  applicationContext,
  document,
  key,
  onUploadProgress = () => {},
}) => {
  const docId = key || applicationContext.getUniqueId();
  const policy = await getUploadPolicy({
    applicationContext,
    key: docId,
  });
  await applicationContext.getPersistenceGateway().uploadPdfFromClient({
    applicationContext,
    file: document,
    key: docId,
    onUploadProgress,
    policy,
  });
  return docId;
};
