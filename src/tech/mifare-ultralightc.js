/**
 * Created by alexvanboxel on 25/08/14.
 */



function tagMifareUltralightC(nfcAdapter,spec,shared) {

  var self = this;
  var shared = shared || {};

  var that = tagMifareUltralight(nfcAdapter,spec,shared);

  /**
   * {
   *  sector: 1,
   *  key: [],
   *  keyIndex: 0 (for A) or 1 (for B)
   * }
   */
  var authenicate = function(spec,onSuccess,onFailure) {

    var key = spec.key;
    if(!key) {
      throw new RuntimeException("Key is null.");
    }
    if(key.length != 16) {
      throw new RuntimeException("Key needs to be 128 bit.");
    }

    var initVector = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    // should be random

    // Get encrypted Random B, this random number is encrypted with the 128 key of the tag
    var encryptedRndB = transceive(new Uint8Array([
      0x1A, 0x00
    ]));
    encryptedRndB = Arrays.copyOfRange(encryptedRndB, 1, 9);

    // Initialize the crypto engine in 3DES with a 0 vector and out 128 bit key
    var secretKey = new SecretKeySpec(key, "DESede");
    var cipher = Cipher.getInstance("DESede/CBC/NoPadding");
    var ivParameterSpec = new IvParameterSpec(initVector);
    cipher.init(Cipher.DECRYPT_MODE, secretKey, ivParameterSpec);

    // Decrypt the random number of the tag
    var rndB = cipher.doFinal(encryptedRndB);

    // Generate generate a random number
    var rndA = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);

    // Combine the out random number and the tags random number, encrypt
    var encryptVector = new IvParameterSpec(encryptedRndB);
    cipher.init(Cipher.ENCRYPT_MODE, secretKey, encryptVector);
    var encryptedToken = cipher.doFinal(combineRandomToken(rndA, rndB));

    // Send to token to the tag to prove we have the same 3DES key
    var encryptedRndA = transceive(Bytes.concat(new Uint8Array([ 0xAF]), encryptedToken));
    encryptedRndA = Arrays.copyOfRange(encryptedRndA, 1, 9);

    //System.out.println("encryptedRndA: " + IOUtil.hex(encryptedRndA));
    //IvParameterSpec ivParameterSpec = new IvParameterSpec(initVector);
    cipher.init(Cipher.DECRYPT_MODE, secretKey, ivParameterSpec);

    var decryptedRndA = cipher.doFinal( rol(xor ( encryptedRndA )) );
    //System.out.println("decryptedRndA: " + IOUtil.hex(decryptedRndA));



  }

  that.authenticate = authenticate;

  return that;
}