const assert = require('assert');
const Run = require('../models/run.model')


describe('run.model', function () {
  it('create new run', function (done) {
    const run = new Run({
      title  : params.data.title,
      content: params.data.content
    })
    return run.save()
  });
});