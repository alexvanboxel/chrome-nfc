/*
 * Copyright 2014 IOTOPE All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @fileoverview TLV implementation.
 */

'use strict';


function tlvBase(shared) {

  var self = this;
  var shared = shared || {};

  var that = {};

  var getBytesLength = function() {
    var length = 1;
    if(shared.L) {
      length++;
    }
    if(shared.V) {
      length+=shared.V.byteLength;
    }
    return length;
  };

  var getBytes = function() {
    var b;
    if(shared.L) {
      b = new Uint8Array([shared.T, shared.L]);
    }
    else {
      b = new Uint8Array([shared.T]);
    }
    if(shared.V) {
      return UTIL_concat(b, new Uint8Array(shared.V));
    }
    return b;
  };

  that.getBytesLength = getBytesLength;
  that.getBytes = getBytes;
  return that;
}

/**
 * NDEF Message TLV 03h Contains an NDEF message
 * @returns {*}
 */
function tlvNDEF(ndef) {

  var self = this;

  var payload = ndef.compose();

  var shared = {};
  shared.T = 0x03;
  shared.L = payload.byteLength;
  shared.V = payload;

  var that = tlvBase(shared);
  return that;
}

/**
 * NULL TLV 00h Might be used for padding of memory areas and the NFC Forum Device SHALL ignore this
 * @returns {*}
 */
function tlvNULL() {

  var self = this;
  var shared = {};
  shared.T = 0x00;
  shared.L = undefined;
  shared.V = undefined;

  var that = tlvBase(shared);
  return that;
}

/**
 * Lock Control TLV 01h Defines details of the lock bits
 * @returns {*}
 */
function tlvLockControl() {

  var self = this;
  var shared = {};
  shared.T = 0x01;
  shared.L = 0x03;
  shared.V = [0xA0,0x10,0x44];

  var that = tlvBase(shared);
  return that;
}

/**
 * Memory Control TLV 02h Identifies reserved memory areas
 * @returns {*}
 */
function tlvMemoryControl() {

  var self = this;
  var shared = {};
  shared.T = 0x02;
  shared.L = 0x03;
  shared.V = undefined;

  var that = tlvBase(shared);
  return that;
}

/**
 * Proprietary TLV FDh Tag proprietary information
 * @returns {*}
 */
function tlvProprietary() {

  var self = this;
  var shared = {};
  shared.T = 0xFD;
  shared.L = undefined;
  shared.V = undefined;

  var that = tlvBase(shared);
  return that;
}

/**
 * Terminator TLV
 * @returns {*}
 */
function tlvTerminator() {

  var self = this;
  var shared = {};
  shared.T = 0xFE;
  shared.L = undefined;
  shared.V = undefined;

  var that = tlvBase(shared);
  return that;
}

/**
 * Terminator TLV
 * @returns {*}
 */
function tlvBlock(tlv) {

  var getBytesLength = function() {
    var len = 0;
    for(var e in tlv) {
      len += tlv[e].getBytesLength();
    }
    return len;
  };

  var getBytes = function() {
    var b = new Uint8Array([]);
    for(var e in tlv) {
      b = UTIL_concat(b, tlv[e].getBytes());
    }
    return b;
  };

  var that = {};
  that.getBytesLength = getBytesLength;
  that.getBytes = getBytes;
  return that;
}


