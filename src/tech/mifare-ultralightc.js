/**
 * Created by alexvanboxel on 25/08/14.
 */



function tagMifareUltralightC(nfcAdapter, spec, shared) {

  var self = this;
  var shared = shared || {};

  var KEY_DEFAULT = new Uint8Array([ 0x49, 0x45, 0x4D, 0x4B, 0x41, 0x45, 0x52, 0x42,
                                    0x21, 0x4E, 0x41, 0x43, 0x55, 0x4F, 0x59, 0x46]);

  var that = tagMifareUltralight(nfcAdapter, spec, shared);
  that.KEY_DEFAULT = KEY_DEFAULT;

  function combineRandomToken(rndA, rndB) {
    return UTIL_concat(rndA, rol(xor(rndB)));
  }

  function xor(bytes) {
    var res = new Uint8Array(bytes.length);

    for (var i = 0; i < bytes.length; i++) {
      res[i] = bytes[i] ^ 0;
    }
    return res;
  }

  function rol(bytes) {
    var res = new Uint8Array(bytes.length);
    res[bytes.length - 1] = bytes[0];
    for (var i = 1; i < bytes.length; i++) {
      res[i - 1] = bytes[i];
    }
    return res;
  }


  var authenticate = function (spec, onSuccess, onFailure) {
//    var key = spec.key;
//    if (!key) {
//      throw new RuntimeException("Key is null.");
//    }
//    if (key.sigBytes != 16) {
//      throw new RuntimeException("Key needs to be 128 bit.");
//    }

    var initVector = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    var randomA = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08])

    // Get encrypted Random B, this random number is encrypted with the 128 key of the tag
    nfcAdapter.communicate(new Uint8Array([
      0x1A, 0x00
    ]), function (encryptedRndB) {

      var encryptedRndB = encryptedRndB.subarray(1, 9);

      /** AUTHENTICE NOT WORKING... Need more research into JS Encryption with 3DES !!!*/

      // Decrypt the random number of the tag

      // Combine the our random number (faked) and the tags random number, encrypt
      //var combinedToken = "0102030405060708" + hexRndB;

      var combinedToken = combineRandomToken(randomA, UTIL_HexToUint8Array(hexRndB) );

    });
  }

  that.authenticate = authenticate;

  return that;
}