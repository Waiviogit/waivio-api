class RequestPipeline {
  constructor(getCacheFn, saveCacheFn) {
    this.steps = [];
    this.getCacheFn = getCacheFn;
    this.saveCacheFn = saveCacheFn;
  }

  use(fn) {
    this.steps.push(fn);
    return this;
  }

  async execute(data, req) {
    let result = data;
    for (const step of this.steps) {
      result = await step(result, req);
    }
    return result;
  }

  async getCache(key) {
    if (typeof this.getCacheFn !== 'function') throw new Error('no getCacheFn');
    return this.getCacheFn(key);
  }

  async executeAndCache(data, req, options) {
    if (!options.key || !options.ttl) throw new Error('no options executeAndCache');
    if (typeof this.saveCacheFn !== 'function') throw new Error('no saveCacheFn');
    const { key, ttl } = options;

    let result = data;
    for (const step of this.steps) {
      result = await step(result, req);
    }
    await this.saveCacheFn({ data: result, key, ttl });
    return result;
  }
}

module.exports = RequestPipeline;
