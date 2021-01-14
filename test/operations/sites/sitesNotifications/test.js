const {
  expect, sinon, dropDatabase, _,
} = require('test/testHelper');
const { AppFactory } = require('test/factories');
const manage = require('utilities/operations/sites/manage');
const notificationsHelper = require('utilities/helpers/notificationsHelper');
const { balanceNotification } = require('utilities/operations/sites/sitesNotifications');
const { NOTIFICATION } = require('constants/sitesConstants');

describe('On balanceNotification', async () => {
  let app;
  const randomTwoSix = _.random(2, 6);
  const notNotificationDays = _.sample([
    ..._.range(8, 13),
    ..._.range(15, 20),
    ..._.range(15, 20),
    ..._.range(22, 29),
    ..._.range(31, 59),
    ..._.range(31, 59),
    ..._.range(61, 89),
    ..._.range(91, 100),
  ]);
  beforeEach(async () => {
    await dropDatabase();
    app = await AppFactory.Create();
    sinon.spy(notificationsHelper, 'sendNotification');
  });
  afterEach(() => {
    sinon.restore();
  });
  it('should send notification called with attention message', async () => {
    const reqData = {
      id: NOTIFICATION.BALANCE_ID, data: [{ owner: app.owner, message: NOTIFICATION.ATTENTION }],
    };
    await sinon.stub(manage, 'getManagePage').returns(Promise.resolve({ accountBalance: { paid: _.random(-1, -100) } }));
    await balanceNotification();
    expect(notificationsHelper.sendNotification).to.calledWithExactly(reqData);
  });
  it('should send notification called with 90 days message', async () => {
    const reqData = {
      id: NOTIFICATION.BALANCE_ID, data: [{ owner: app.owner, message: `${NOTIFICATION.WARNING} 3 month` }],
    };
    await sinon.stub(manage, 'getManagePage').returns(Promise.resolve({ accountBalance: { remainingDays: 90 } }));
    await balanceNotification();
    expect(notificationsHelper.sendNotification).to.calledWithExactly(reqData);
  });
  it('should send notification called with 60 days message', async () => {
    const reqData = {
      id: NOTIFICATION.BALANCE_ID, data: [{ owner: app.owner, message: `${NOTIFICATION.WARNING} 2 month` }],
    };
    await sinon.stub(manage, 'getManagePage').returns(Promise.resolve({ accountBalance: { remainingDays: 60 } }));
    await balanceNotification();
    expect(notificationsHelper.sendNotification).to.calledWithExactly(reqData);
  });
  it('should send notification called with 30 days message', async () => {
    const reqData = {
      id: NOTIFICATION.BALANCE_ID, data: [{ owner: app.owner, message: `${NOTIFICATION.WARNING} 1 month` }],
    };
    await sinon.stub(manage, 'getManagePage').returns(Promise.resolve({ accountBalance: { remainingDays: 30 } }));
    await balanceNotification();
    expect(notificationsHelper.sendNotification).to.calledWithExactly(reqData);
  });
  it('should send notification called with 21 days message', async () => {
    const reqData = {
      id: NOTIFICATION.BALANCE_ID, data: [{ owner: app.owner, message: `${NOTIFICATION.WARNING} 3 weeks` }],
    };
    await sinon.stub(manage, 'getManagePage').returns(Promise.resolve({ accountBalance: { remainingDays: 21 } }));
    await balanceNotification();
    expect(notificationsHelper.sendNotification).to.calledWithExactly(reqData);
  });
  it('should send notification called with 14 days message', async () => {
    const reqData = {
      id: NOTIFICATION.BALANCE_ID, data: [{ owner: app.owner, message: `${NOTIFICATION.WARNING} 2 weeks` }],
    };
    await sinon.stub(manage, 'getManagePage').returns(Promise.resolve({ accountBalance: { remainingDays: 14 } }));
    await balanceNotification();
    expect(notificationsHelper.sendNotification).to.calledWithExactly(reqData);
  });
  it('should send notification called with 7 days message', async () => {
    const reqData = {
      id: NOTIFICATION.BALANCE_ID, data: [{ owner: app.owner, message: `${NOTIFICATION.WARNING} a week` }],
    };
    await sinon.stub(manage, 'getManagePage').returns(Promise.resolve({ accountBalance: { remainingDays: 7 } }));
    await balanceNotification();
    expect(notificationsHelper.sendNotification).to.calledWithExactly(reqData);
  });
  it('should send notification called with 6 -2  days message', async () => {
    const reqData = {
      id: NOTIFICATION.BALANCE_ID, data: [{ owner: app.owner, message: `${NOTIFICATION.WARNING} ${randomTwoSix} days` }],
    };
    await sinon.stub(manage, 'getManagePage').returns(Promise.resolve({ accountBalance: { remainingDays: randomTwoSix } }));
    await balanceNotification();
    expect(notificationsHelper.sendNotification).to.calledWithExactly(reqData);
  });
  it('should send notification called with 1 days message', async () => {
    const reqData = {
      id: NOTIFICATION.BALANCE_ID, data: [{ owner: app.owner, message: `${NOTIFICATION.WARNING} a day` }],
    };
    await sinon.stub(manage, 'getManagePage').returns(Promise.resolve({ accountBalance: { remainingDays: 1 } }));
    await balanceNotification();
    expect(notificationsHelper.sendNotification).to.calledWithExactly(reqData);
  });
  it('should not send notification on notNotificationDays', async () => {
    await sinon.stub(manage, 'getManagePage')
      .returns(Promise.resolve({ accountBalance: { remainingDays: notNotificationDays } }));
    await balanceNotification();
    expect(notificationsHelper.sendNotification).to.not.called;
  });
});
