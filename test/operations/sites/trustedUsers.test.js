const { expect } = require('chai');
const { App } = require('../../../models');
const { getTrusted, getTrustedUsers } = require('../../../utilities/operations/sites/trustedUsers');
const { dropDatabase } = require('../../testHelper');
const { UsersFactory } = require('../../factories');

describe('getTrusted', () => {
  const trustedUser1 = 'trusteduser1';
  const trustedUser2 = 'trusteduser2';
  const nestedTrustedUser = 'nestedtrusteduser';

  beforeEach(async () => {
    await dropDatabase();
  });

  it('returns empty array when no trusted users provided', async () => {
    const result = await getTrusted({ trusted: [] });
    expect(result).to.be.an('array').that.is.empty;
  });

  it('returns trusted users with correct guideName for initial trusted users', async () => {
    const result = await getTrusted({ trusted: [trustedUser1, trustedUser2] });

    expect(result).to.have.length(2);
    expect(result).to.deep.include({ name: trustedUser1, guideName: trustedUser1 });
    expect(result).to.deep.include({ name: trustedUser2, guideName: trustedUser2 });
  });

  it('removes duplicate trusted users', async () => {
    const result = await getTrusted({ trusted: [trustedUser1, trustedUser1, trustedUser2] });

    expect(result).to.have.length(2);
    expect(result).to.deep.include({ name: trustedUser1, guideName: trustedUser1 });
    expect(result).to.deep.include({ name: trustedUser2, guideName: trustedUser2 });
  });

  it('respects maxDepth parameter', async () => {
    // Create an app with trusted users
    await App.create({
      owner: trustedUser1,
      host: 'app1.com',
      trusted: [nestedTrustedUser],
    });

    // Create a nested app with another trusted user
    await App.create({
      owner: nestedTrustedUser,
      host: 'app2.com',
      trusted: ['deepnesteduser'],
    });

    // Test with maxDepth = 1
    const result = await getTrusted({
      trusted: [trustedUser1],
      maxDepth: 1,
    });

    // Should include trustedUser1 and nestedTrustedUser, but not deepnesteduser
    expect(result).to.have.length(2);
    expect(result).to.deep.include({ name: trustedUser1, guideName: trustedUser1 });
    expect(result).to.deep.include({ name: nestedTrustedUser, guideName: trustedUser1 });
  });

  it('correctly sets guideName for nested trusted users', async () => {
    // Create an app with trusted users
    await App.create({
      owner: trustedUser1,
      host: 'app1.com',
      trusted: [nestedTrustedUser],
    });

    const result = await getTrusted({ trusted: [trustedUser1] });

    // The nested trusted user should have the initial trusted user as guideName
    expect(result).to.have.length(2);
    expect(result).to.deep.include({ name: trustedUser1, guideName: trustedUser1 });
    expect(result).to.deep.include({ name: nestedTrustedUser, guideName: trustedUser1 });
  });

  it('handles multiple levels of nested trusted users', async () => {
    // Create apps with nested trusted users
    await App.create({
      owner: trustedUser1,
      host: 'app1.com',
      trusted: [trustedUser2],
    });

    await App.create({
      owner: trustedUser2,
      host: 'app2.com',
      trusted: [nestedTrustedUser],
    });

    const result = await getTrusted({ trusted: [trustedUser1] });

    // Should include all three users with correct guideName
    expect(result).to.have.length(3);
    expect(result).to.deep.include({ name: trustedUser1, guideName: trustedUser1 });
    expect(result).to.deep.include({ name: trustedUser2, guideName: trustedUser1 });
    expect(result).to.deep.include({ name: nestedTrustedUser, guideName: trustedUser1 });
  });

  it('handles circular trusted user relationships', async () => {
    // Create apps with circular trusted users
    await App.create({
      owner: trustedUser1,
      host: 'app1.com',
      trusted: [trustedUser2],
    });

    await App.create({
      owner: trustedUser2,
      host: 'app2.com',
      trusted: [trustedUser1],
    });

    const result = await getTrusted({ trusted: [trustedUser1] });

    // Should include both users without infinite recursion
    expect(result).to.have.length(2);
    expect(result).to.deep.include({ name: trustedUser1, guideName: trustedUser1 });
    expect(result).to.deep.include({ name: trustedUser2, guideName: trustedUser1 });
  });

  it('returns existing trusted users from trustedUsersMap', async () => {
    const trustedUsersMap = {
      [trustedUser1]: { name: trustedUser1, guideName: 'existingguide' },
    };

    const result = await getTrusted({
      trusted: [trustedUser1, trustedUser2],
      trustedUsersMap,
    });

    // Should include the existing user with its guideName and the new user
    expect(result).to.have.length(2);
    expect(result).to.deep.include({ name: trustedUser1, guideName: 'existingguide' });
    expect(result).to.deep.include({ name: trustedUser2, guideName: trustedUser2 });
  });
});

describe('getTrustedUsers', () => {
  const owner = 'testowner';
  const host = 'test.com';
  const trustedUser1 = 'trusteduser1';
  const trustedUser2 = 'trusteduser2';
  const nestedTrustedUser = 'nestedtrusteduser';

  beforeEach(async () => {
    await dropDatabase();
  });

  it('returns error when app not found', async () => {
    const result = await getTrustedUsers({ host, owner });
    expect(result).to.deep.equal({ error: { status: 401 } });
  });

  it('returns empty result when app has no trusted users', async () => {
    await App.create({ owner, host, trusted: [] });

    const result = await getTrustedUsers({ host, owner });
    expect(result.result).to.be.an('array').that.is.empty;
  });

  it('returns trusted users with correct guideName', async () => {
    // Create app with trusted users
    await App.create({
      owner,
      host,
      trusted: [trustedUser1, trustedUser2],
    });

    // Create user data using factory
    await UsersFactory.Create({
      name: trustedUser1,
      json_metadata: JSON.stringify({ profile: { name: 'Trusted User 1' } }),
      wobjects_weight: 10,
    });

    await UsersFactory.Create({
      name: trustedUser2,
      json_metadata: JSON.stringify({ profile: { name: 'Trusted User 2' } }),
      wobjects_weight: 20,
    });

    const result = await getTrustedUsers({ host, owner });

    expect(result.result).to.have.length(2);
    expect(result.result[0]).to.have.property('name', trustedUser1);
    expect(result.result[1]).to.have.property('name', trustedUser2);
    // First-level trusted users don't have guideName property
  });

  it('returns nested trusted users with correct guideName', async () => {
    // Create app with trusted users
    await App.create({
      owner,
      host,
      trusted: [trustedUser1],
    });

    // Create app owned by trusted user with nested trusted users
    await App.create({
      owner: trustedUser1,
      host: 'app1.com',
      trusted: [trustedUser2, nestedTrustedUser],
    });

    // Create user data using factory
    await UsersFactory.Create({
      name: trustedUser1,
      json_metadata: JSON.stringify({ profile: { name: 'Trusted User 1' } }),
      wobjects_weight: 10,
    });

    await UsersFactory.Create({
      name: trustedUser2,
      json_metadata: JSON.stringify({ profile: { name: 'Trusted User 2' } }),
      wobjects_weight: 20,
    });

    await UsersFactory.Create({
      name: nestedTrustedUser,
      json_metadata: JSON.stringify({ profile: { name: 'Nested Trusted User' } }),
      wobjects_weight: 30,
    });

    const result = await getTrustedUsers({ host, owner });

    expect(result.result).to.have.length(3);

    // Check that all users are included and have correct guideName
    const user2 = result.result.find((u) => u.name === trustedUser2);
    const nestedUser = result.result.find((u) => u.name === nestedTrustedUser);

    // First-level trusted users don't have guideName property
    expect(user2).to.have.property('guideName', trustedUser1);
    expect(nestedUser).to.have.property('guideName', trustedUser1);
  });

  it('orders results by guideName and name', async () => {
    // Create app with trusted users
    await App.create({
      owner,
      host,
      trusted: [trustedUser1, trustedUser2, nestedTrustedUser],
    });

    // Create user data using factory
    await UsersFactory.Create({
      name: trustedUser1,
      json_metadata: JSON.stringify({ profile: { name: 'Trusted User 1' } }),
      wobjects_weight: 10,
    });

    await UsersFactory.Create({
      name: trustedUser2,
      json_metadata: JSON.stringify({ profile: { name: 'Trusted User 2' } }),
      wobjects_weight: 20,
    });

    await UsersFactory.Create({
      name: nestedTrustedUser,
      json_metadata: JSON.stringify({ profile: { name: 'Nested Trusted User' } }),
      wobjects_weight: 30,
    });

    const result = await getTrustedUsers({ host, owner });

    expect(result.result).to.have.length(3);

    // Check that results are ordered by guideName and name
    expect(result.result[0].name).to.equal(nestedTrustedUser);
    expect(result.result[1].name).to.equal(trustedUser1);
    expect(result.result[2].name).to.equal(trustedUser2);
  });

  it('handles users not found in database', async () => {
    // Create app with trusted users
    await App.create({
      owner,
      host,
      trusted: [trustedUser1, 'nonexistentuser'],
    });

    // Create user data for only one of the trusted users using factory
    await UsersFactory.Create({
      name: trustedUser1,
      json_metadata: JSON.stringify({ profile: { name: 'Trusted User 1' } }),
      wobjects_weight: 10,
    });

    const result = await getTrustedUsers({ host, owner });

    // Should only return the user that exists in the database
    expect(result.result).to.have.length(1);
    expect(result.result[0]).to.have.property('name', trustedUser1);
  });
});
