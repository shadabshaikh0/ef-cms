import _ from 'lodash';

export default test => {
  return it('Docket clerk forward work item', async () => {
    test.setState('form', {
      [test.workItemId]: {
        forwardRecipientId: 'seniorattorney',
        forwardMessage: 'hello world',
      },
    });
    await test.runSequence('submitForwardSequence', {
      workItemId: test.workItemId,
    });
    const caseDetail = test.getState('caseDetail');
    let workItem;
    caseDetail.documents.forEach(document =>
      document.workItems.forEach(item => {
        if (item.workItemId === test.stipulatedDecisionWorkItemId) {
          workItem = item;
        }
      }),
    );
    expect(workItem).toMatchObject({
      assigneeId: 'seniorattorney',
      assigneeName: 'Test Seniorattorney',
    });
    const messages = _.orderBy(workItem.messages, 'createdAt', 'desc');
    expect(messages.length).toEqual(3);
    expect(messages[0]).toMatchObject({
      message: 'hello world',
      userId: 'docketclerk',
      sentBy: 'Test Docketclerk',
    });
  });
};