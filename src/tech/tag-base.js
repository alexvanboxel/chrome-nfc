/**
 * Created by alexvanboxel on 24/08/14.
 */

'use strict';


function tagBase(nfcAdapter,spec,shared) {

  var self = this;
  var shared = shared || {};

  var that = {};

  var getId = function() {
    return spec.tagId;
  }

  var getNfcAdapter = function() {
    return nfcAdapter;
  }

  that.getId = getId;
  that.getNfcAdapter = getNfcAdapter;

  return that;
}