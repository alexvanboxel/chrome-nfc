/**
 * Created by alexvanboxel on 25/08/14.
 */



function tagType2(nfcAdapter, spec, shared) {

  var self = this;
  var shared = shared || {};

  var that = tagBase(nfcAdapter, spec, shared);

  var transceive = function (data, onSuccess,onError) {
    nfcAdapter.transceive(spec.tagIndex, data, onSuccess,onError);
  }

  var readBlock = function (block, onSuccess,onError) {
    /* function-wise variable */
    var u8 = new Uint8Array(2);  // Type 2 tag command
    u8[0] = 0x30;                // READ command
    u8[1] = block;               // block number

    that.transceive(u8, function (data) {
      onSuccess(data);
    },onError);
  }

  var writeBlock = function (blk_no, data, onSuccess,onError) {
    var u8 = new Uint8Array(2 + data.length);
    u8[0] = 0xA2;
    u8[1] = blk_no;
    for (var i = 0; i < data.length; i++) {
      u8[2 + i] = data[i];
    }

    that.transceive(u8, function () {
      onSuccess(0);
    }),onError;
  }

  var writeData = function (start, data, onSuccess, onError) {
    var payload = data.getBytes();
    var blockCount = Math.floor((payload.length + 3) / 4);

    function writePart(data, offset) {
      if (offset >= blockCount) { return onSuccess(); }

      var block = data.subarray(offset * 4, offset * 4 + 4);
      if (block.length < 4) block = UTIL_concat(block,
        new Uint8Array(4 - block.length));

      that.writeBlock(start+offset, block, function() {
        writePart(data, offset + 1);
      }, onError);
    }

    writePart(payload, 0);
  }

  var write = function (blocks, onSuccess, onError) {
    var l = blocks.length;

    function writePart(i) {
      if(i>=l) {
        onSuccess();
        return;
      }
      var b = blocks[i];
      writeData(b.offset,b.data,function() {
        writePart(++i);
      },onError);
    }
    writePart(0);
  }

  that.transceive = transceive;
  that.readBlock = readBlock;
  that.writeBlock = writeBlock;
  that.write = write;

  return that;
}