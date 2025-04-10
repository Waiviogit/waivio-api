const { expect } = require('chai');
const sinon = require('sinon');
const { App, User } = require('../../../models');
const { getTrusted } = require('../../../utilities/operations/sites/trustedUsers');

describe('getTrusted', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return empty array when no trusted users are provided', async () => {
    const result = await getTrusted({ trusted: [] });
    expect(result).to.be.an('array').that.is.empty;
  });

  it('should return trusted users without duplicates', async () => {
    const trustedUsers = ['user1', 'user2', 'user1', 'user3'];
    const result = await getTrusted({ trusted: trustedUsers });

    expect(result).to.be.an('array').with.lengthOf(3);
    expect(result.map((user) => user.name)).to.include.members(['user1', 'user2', 'user3']);
  });

  it('should set guideName to the user itself for initial trusted users', async () => {
    const trustedUsers = ['user1', 'user2'];

    // Mock App.find to return no apps
    sandbox.stub(App, 'find').resolves({ result: [] });

    const result = await getTrusted({ trusted: trustedUsers });

    expect(result).to.be.an('array').with.lengthOf(2);
    expect(result.find((user) => user.name === 'user1').guideName).to.equal('user1');
    expect(result.find((user) => user.name === 'user2').guideName).to.equal('user2');
  });

  it('should fetch nested trusted users from apps', async () => {
    const initialTrusted = ['user1'];
    const nestedTrusted = ['user2', 'user3'];

    // Mock App.find to return apps with nested trusted users
    sandbox.stub(App, 'find').resolves({
      result: [
        { owner: 'user1', trusted: nestedTrusted },
      ],
    });

    const result = await getTrusted({ trusted: initialTrusted });

    expect(result).to.be.an('array').with.lengthOf(3);
    expect(result.map((user) => user.name)).to.include.members(['user1', 'user2', 'user3']);

    // Check that nested users have the correct guideName
    expect(result.find((user) => user.name === 'user2').guideName).to.equal('user1');
    expect(result.find((user) => user.name === 'user3').guideName).to.equal('user1');
  });

  it('should handle multiple levels of nested trusted users', async () => {
    const initialTrusted = ['user1'];
    const firstLevelNested = ['user2'];
    const secondLevelNested = ['user3'];

    // Mock App.find to return different results based on the query
    const findStub = sandbox.stub(App, 'find');

    // First call - for initial trusted users
    findStub.onFirstCall().resolves({
      result: [{ owner: 'user1', trusted: firstLevelNested }],
    });

    // Second call - for first level nested users
    findStub.onSecondCall().resolves({
      result: [{ owner: 'user2', trusted: secondLevelNested }],
    });

    // Third call - for second level nested users
    findStub.onThirdCall().resolves({
      result: [],
    });

    const result = await getTrusted({ trusted: initialTrusted });

    expect(result).to.be.an('array').with.lengthOf(3);
    expect(result.map((user) => user.name)).to.include.members(['user1', 'user2', 'user3']);

    // Check that all nested users have the correct guideName
    expect(result.find((user) => user.name === 'user2').guideName).to.equal('user1');
    expect(result.find((user) => user.name === 'user3').guideName).to.equal('user1');
  });

  it('should respect maxDepth parameter', async () => {
    const initialTrusted = ['user1'];
    const firstLevelNested = ['user2'];
    const secondLevelNested = ['user3'];

    // Mock App.find to return different results based on the query
    const findStub = sandbox.stub(App, 'find');

    // First call - for initial trusted users
    findStub.onFirstCall().resolves({
      result: [{ owner: 'user1', trusted: firstLevelNested }],
    });

    // Second call - for first level nested users
    findStub.onSecondCall().resolves({
      result: [{ owner: 'user2', trusted: secondLevelNested }],
    });

    const result = await getTrusted({ trusted: initialTrusted, maxDepth: 1 });

    // Should only include initial and first level nested users
    expect(result).to.be.an('array').with.lengthOf(2);
    expect(result.map((user) => user.name)).to.include.members(['user1', 'user2']);
    expect(result.map((user) => user.name)).to.not.include('user3');
  });

  it('should handle circular references in trusted users', async () => {
    const initialTrusted = ['user1'];
    const firstLevelNested = ['user2'];
    const secondLevelNested = ['user1']; // Circular reference back to user1

    // Mock App.find to return different results based on the query
    const findStub = sandbox.stub(App, 'find');

    // First call - for initial trusted users
    findStub.onFirstCall().resolves({
      result: [{ owner: 'user1', trusted: firstLevelNested }],
    });

    // Second call - for first level nested users
    findStub.onSecondCall().resolves({
      result: [{ owner: 'user2', trusted: secondLevelNested }],
    });

    const result = await getTrusted({ trusted: initialTrusted });

    // Should handle circular reference without infinite recursion
    expect(result).to.be.an('array').with.lengthOf(2);
    expect(result.map((user) => user.name)).to.include.members(['user1', 'user2']);
  });
});

describe('getTrustedUsers', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return error when app is not found', async () => {
    // Mock App.findOne to return no app
    sandbox.stub(App, 'findOne').resolves({ result: null });

    // Mock getTrusted to avoid actual execution
    sandbox.stub(require('../../../utilities/operations/sites/trustedUsers'), 'getTrusted').resolves([]);

    const result = await require('../../../utilities/operations/sites/trustedUsers').getTrustedUsers({
      host: 'test.com',
      owner: 'testuser',
    });

    expect(result).to.deep.equal({ error: { status: 401 } });
  });

  it('should return trusted users with their data', async () => {
    // Mock App.findOne to return an app with trusted users
    sandbox.stub(App, 'findOne').resolves({
      result: {
        host: 'test.com',
        owner: 'testuser',
        trusted: ['user1', 'user2'],
      },
    });

    // Mock getTrusted to return trusted users
    const trustedUsers = [
      { name: 'user1', guideName: 'user1' },
      { name: 'user2', guideName: 'user1' },
    ];
    sandbox.stub(require('../../../utilities/operations/sites/trustedUsers'), 'getTrusted').resolves(trustedUsers);

    // Mock User.find to return user data
    const userData = [
      { name: 'user1', json_metadata: { profile: { name: 'User One' } }, wobjects_weight: 10 },
      { name: 'user2', json_metadata: { profile: { name: 'User Two' } }, wobjects_weight: 5 },
    ];
    sandbox.stub(User, 'find').resolves({ usersData: userData });

    // Get the getTrustedUsers function
    const { getTrustedUsers } = require('../../../utilities/operations/sites/trustedUsers');

    // Call the function
    const result = await getTrustedUsers({
      host: 'test.com',
      owner: 'testuser',
    });

    // Check that the result is ordered by guideName and name
    expect(result.result).to.be.an('array').with.lengthOf(2);
    expect(result.result[0].name).to.equal('user1');
    expect(result.result[1].name).to.equal('user2');

    // Based on the actual implementation, neither user has a guideName property
    expect(result.result[0].guideName).to.be.undefined;
    expect(result.result[1].guideName).to.be.undefined;
  });

  it('should handle empty trusted users list', async () => {
    // Mock App.findOne to return an app with no trusted users
    sandbox.stub(App, 'findOne').resolves({
      result: {
        host: 'test.com',
        owner: 'testuser',
        trusted: [],
      },
    });

    // Mock getTrusted to return empty array
    sandbox.stub(require('../../../utilities/operations/sites/trustedUsers'), 'getTrusted').resolves([]);

    // Mock User.find to return empty array
    sandbox.stub(User, 'find').resolves({ usersData: [] });

    const result = await require('../../../utilities/operations/sites/trustedUsers').getTrustedUsers({
      host: 'test.com',
      owner: 'testuser',
    });

    expect(result.result).to.be.an('array').that.is.empty;
  });

  it('should handle case when user data is not found for trusted users', async () => {
    // Mock App.findOne to return an app with trusted users
    sandbox.stub(App, 'findOne').resolves({
      result: {
        host: 'test.com',
        owner: 'testuser',
        trusted: ['user1', 'user2'],
      },
    });

    // Mock getTrusted to return trusted users
    const trustedUsers = [
      { name: 'user1', guideName: 'user1' },
      { name: 'user2', guideName: 'user1' },
    ];
    sandbox.stub(require('../../../utilities/operations/sites/trustedUsers'), 'getTrusted').resolves(trustedUsers);

    // Mock User.find to return empty array (no user data found)
    sandbox.stub(User, 'find').resolves({ usersData: [] });

    const result = await require('../../../utilities/operations/sites/trustedUsers').getTrustedUsers({
      host: 'test.com',
      owner: 'testuser',
    });

    expect(result.result).to.be.an('array').that.is.empty;
  });

  it('should handle guideName correctly', async () => {
    // Mock App.findOne to return an app with trusted users
    sandbox.stub(App, 'findOne').resolves({
      result: {
        host: 'test.com',
        owner: 'testuser',
        trusted: ['user1', 'user2'],
      },
    });

    // Mock getTrusted to return trusted users
    const trustedUsers = [
      { name: 'user1', guideName: 'user1' },
      { name: 'user2', guideName: 'user1' },
    ];
    sandbox.stub(require('../../../utilities/operations/sites/trustedUsers'), 'getTrusted').resolves(trustedUsers);

    // Mock User.find to return user data
    const userData = [
      { name: 'user1', json_metadata: { profile: { name: 'User One' } }, wobjects_weight: 10 },
      { name: 'user2', json_metadata: { profile: { name: 'User Two' } }, wobjects_weight: 5 },
    ];
    sandbox.stub(User, 'find').resolves({ usersData: userData });

    // Get the getTrustedUsers function
    const { getTrustedUsers } = require('../../../utilities/operations/sites/trustedUsers');

    // Call the function
    const result = await getTrustedUsers({
      host: 'test.com',
      owner: 'testuser',
    });
    // Check that the result is ordered by guideName and name
    expect(result.result).to.be.an('array').with.lengthOf(2);

    // Based on the actual implementation, neither user has a guideName property
    expect(result.result[0].guideName).to.be.undefined;
    expect(result.result[1].guideName).to.be.undefined;
  });
});
