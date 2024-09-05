const rewire = require('rewire');

const myModule = rewire('utilities/operations/wobject/getPostsByWobject');
const makeConditionForPerson = myModule.__get__('makeConditionForPerson');
const { expect } = require('test/testHelper');

describe('getPostsByWobject', async () => {
  describe('makeConditionForPerson', () => {
    it('should return the original condition if wObject.link exists', () => {
      const condition = { someField: 'someValue' };
      const processedObj = { link: 'some link' };
      const result = makeConditionForPerson({ condition, processedObj });

      expect(result).to.deep.equal({ condition });
    });

    it('should return the original condition if parsedCondition is not a valid JSON', () => {
      const condition = { someField: 'someValue' };
      const processedObj = { link: 'invalid json' };
      const result = makeConditionForPerson({ condition, processedObj });

      expect(result).to.deep.equal({ condition });
    });

    it('should create a condition with regex for social links', () => {
      const condition = { someField: 'someValue' };
      const processedObj = {
        link: JSON.stringify({
          linkFacebook: '123456789',
          linkTwitter: 'abcdef',
        }),
      };
      const result = makeConditionForPerson({ condition, processedObj });

      expect(result.condition.$or).to.deep.include({
        someField: 'someValue',
      });

      expect(result.condition.$or).to.deep.include({
        links: { $regex: '^https://www.facebook.com/profile.php?id=123456789' },
      });

      expect(result.condition.$or).to.deep.include({
        links: { $regex: '^https://x.com/abcdef' },
      });
    });

    it('should return the original condition if no valid social links are found', () => {
      const condition = { someField: 'someValue' };
      const processedObj = {
        link: JSON.stringify({
          invalidKey: 'value',
        }),
      };
      const result = makeConditionForPerson({ condition, processedObj });

      expect(result).to.deep.equal({ condition });
    });

    it('should handle an empty link object gracefully', () => {
      const condition = { someField: 'someValue' };
      const processedObj = { link: JSON.stringify({}) };
      const result = makeConditionForPerson({ condition, processedObj });

      expect(result).to.deep.equal({ condition });
    });
  });
});
