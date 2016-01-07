var Buffers = require('buffers');

function streamPipeUntilToken(readable, writable, token, callback) {
  token = new Buffer(token);
  var buffers = new Buffers();
  var offset = 0;

  function onEnd() {
    return callback(new Error('stream ended, but token not found'));
  }

  function onReadable() {
    var chunk = readable.read();
    if (chunk === null) {
      return;
    }

    buffers.push(chunk);

    var index = buffers.indexOf(token);
    if (index === -1) {
      if (buffers.length > token.length) {
        var chunkToPush = buffers.splice(0, buffers.length - token.length).toBuffer();
        offset += chunkToPush.length;
        var canContinue = writable.write(chunkToPush);
        if (!canContinue) {
          readable.removeListener('readable', onReadable);
          writable.once('drain', function() {
            readable.on('readable', onReadable);
            onReadable();
          });
        }
      }
    } else {
      readable.removeListener('readable', onReadable);
      readable.removeListener('end', onEnd);

      var chunkToPush = buffers.splice(0, index).toBuffer();
      offset += chunkToPush.length;
      writable.write(chunkToPush);
      readable.unshift(buffers.toBuffer());
      return callback(null, offset);
    }
  }

  readable.on('end', onEnd);
  readable.on('readable', onReadable);
  onReadable();
}
module.exports = streamPipeUntilToken;
