class RequestPipeline {
  constructor() {
    this.steps = [];
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
}

module.exports = RequestPipeline;
