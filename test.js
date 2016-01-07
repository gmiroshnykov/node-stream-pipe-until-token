var assert = require('assert');
var streamBuffers = require('stream-buffers');

var streamPipeUntilToken = require('./index');

describe('streamPipeUntilToken', function() {
  it('should work', function(cb) {
    var input = new streamBuffers.ReadableStreamBuffer({chunkSize: 1});
    var output = new streamBuffers.WritableStreamBuffer();

    input.put('Hello World!');
    input.stop();

    streamPipeUntilToken(input, output, ' World!', function(err, offset) {
      assert.ifError(err);

      assert.equal(offset, 5);
      assert.equal(output.getContentsAsString(), 'Hello');

      var rest = new streamBuffers.WritableStreamBuffer();
      input.pipe(rest).on('finish', function() {
        assert.equal(rest.getContentsAsString(), ' World!');
        cb();
      });
    });
  });

  it('should work over and over', function(cb) {
    var input = new streamBuffers.ReadableStreamBuffer({chunkSize: 1});
    var output = new streamBuffers.WritableStreamBuffer();

    input.put('Hello World!\n');
    input.put('Hello World!\n');
    input.stop();

    streamPipeUntilToken(input, output, ' World!', function(err, offset) {
      assert.ifError(err);

      assert.equal(offset, 5);
      streamPipeUntilToken(input, output, '\n', function(err, offset) {
        assert.ifError(err);

        assert.equal(offset, 7);
        assert.equal(output.getContentsAsString(), 'Hello World!');

        var rest = new streamBuffers.WritableStreamBuffer();
        input.pipe(rest).on('finish', function() {
          assert.equal(rest.getContentsAsString(), '\nHello World!\n');
          cb();
        });
      });
    });
  });

  it('should fail if pattern was not found', function(cb) {
    var input = new streamBuffers.ReadableStreamBuffer({chunkSize: 1});
    var output = new streamBuffers.WritableStreamBuffer();

    input.put('Hello World!');
    input.stop();

    streamPipeUntilToken(input, output, 'Nope', function(err) {
      assert(err);
      assert.equal(err.message, 'stream ended, but token not found');
      cb();
    });
  });
});
