/**
 * Created by alexvanboxel on 25/08/14.
 */



function tagType2(nfcAdapter,spec,shared) {

  var self = this;
  var shared = shared || {};

  var that = tagBase(nfcAdapter,spec,shared);


  return that;
}