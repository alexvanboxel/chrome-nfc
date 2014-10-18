/*
 * Copyright 2014 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @fileoverview NFC Adapter.
 */

'use strict';

// Global adapter instance counter.
var adapterId = 0;

function NfcAdapter() {
  this.dev = null;
  // Pick unique channel (within process..)
  this.cid = (++adapterId) & 0x00ffffff;
  this.onclose = null;
  this.detected_tag = null;   // TODO: move this to mifare_classic.js
  this.auth_key = null;       // TODO: move this to mifare_classic.js
  this.authed_sector = null;  // TODO: move this to mifare_classic.js
  this.KEYS = [               // TODO: move this to mifare_classic.js
    new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),  // defailt
    new Uint8Array([0xd3, 0xf7, 0xd3, 0xf7, 0xd3, 0xf7]),  // NFC Forum
    new Uint8Array([0xa0, 0xa1, 0xa2, 0xa3, 0xa4, 0xa5])   // MAD
  ];

  // TODO: CCID
  this.nfcreader = null;
}

// PASS-THRUE
NfcAdapter.prototype.publicAuthentication = function(block, cb) {
  var self = this;
    self.nfcreader.publicAuthentication(self,block,cb);
}


// onclose callback gets called when device disappears.
NfcAdapter.prototype.open = function(which, cb, onclose) {
  this.rxframes = [];
  this.onclose = onclose;

  this.cid &= 0x00ffffff;
  this.cid |= ((which + 1) << 24);  // For debugging.

  var self = this;
  var callback = cb;
  dev_manager.open(which, this, function(device) {
    self.dev = device;
    var result = (self.dev != null) ? 0 : 1;

    /* extra configuration for ACR122 */
    self.nfcreader = self.dev;
    self.nfcreader.init(self, function() {
      if (callback) callback(result);
    });
  });
};

NfcAdapter.prototype.close = function() {
  var self = this;

  /* deselect and release target if any tag is associated. */
  function deselect_release(cb) {
    self.nfcreader.command(PN53x.InDeselect(),cmdCntx({driver: self.nfcreader, timeout:1}).setCallback(
      function() {
        self.nfcreader.command(PN53x.InRelease(),cmdCntx({driver: self.nfcreader, timeout:1}).setCallback(
          function() {
          }));
      }));
  }

  function dev_manager_close() {
    self.rxframes = null;  // So receivedFrame() will return false.
    if (self.dev) {
      dev_manager.close(self.dev, self);
      self.dev = null;
    }
  }

  deselect_release(dev_manager_close);
};


// Wait for a passive target.
NfcAdapter.prototype.wait_for_passive_target = function(timeout, cb) {
  var self = this;

  if (!cb) cb = defaultCallback;

  var tagDetector = function(tags) {
    if (tags.length > 0) {
      var tagData = tags[0];
      if (tagData.SENS_RES[0] == 0x00 && tagData.SENS_RES[1] == 0x44) {
        console.log("DEBUG: found Mifare Ultralight (106k type A)");
        // TODO: VERY BAD WAY TO KEEP CONTEXT
        self.detected_tag = "Mifare Ultralight";
        self.authed_sector = null;
        self.auth_key = null;
        cb(0,"mifare-ultralight");
        return;
      }
      else if (tagData.SENS_RES[0] == 0x00 && tagData.SENS_RES[1] == 0x04) {
        console.log("DEBUG: found Mifare Classic 1K (106k type A)");
        // TODO: VERY BAD WAY TO KEEP CONTEXT
        self.detected_tag = "Mifare Classic 1K";
        self.authed_sector = null;
        self.auth_key = null;
        cb(0,"mifare-classic");
        return;
      }
    }
    cb();
  }

//  if (self.dev.isACR122()) {
//    self.nfcreader.acr122_set_timeout(self,timeout, function() {
//      self.nfcreader.command(PN53x.InListPassiveTarget(),cmdCntx({callback:tagDetector,timeout:timeout}));
//    });
//  } else {
    self.nfcreader.command(PN53x.InListPassiveTarget(),cmdCntx({driver: self.nfcreader, callback:tagDetector,timeout:timeout}));
//  }
};


/**
 * Replacement of wait_for_passive_target
 * @param timeout
 * @param cb([tags])
 */
NfcAdapter.prototype.detectTags = function(timeout, cb) {
  var self = this;

  if (!cb) cb = defaultCallback;

  var tagDetector = function(tags) {
    if (tags.length > 0) {
      var tagData = tags[0];
      if (tagData.SENS_RES[0] == 0x00 && tagData.SENS_RES[1] == 0x44) {
        console.log("DEBUG: found Mifare Ultralight (106k type A)");
        // TODO: VERY BAD WAY TO KEEP CONTEXT
        self.detected_tag = "Mifare Ultralight";
        self.authed_sector = null;
        self.auth_key = null;
        cb([tagMifareUltralight(self,{
          tagId: tagData.NFCID1,
          tagIndex: 1,
          techName: "Mifare Ultralight"
        })]);
        return;
      }
      else if (tagData.SENS_RES[0] == 0x00 && tagData.SENS_RES[1] == 0x04) {
        console.log("DEBUG: found Mifare Classic 1K (106k type A)");
        // TODO: VERY BAD WAY TO KEEP CONTEXT
        self.detected_tag = "Mifare Classic 1K";
        self.authed_sector = null;
        self.auth_key = null;
        cb([tagMifareClassic(self,{
          tagId: tagData.NFCID1,
          tagIndex: 1,
          techName: "Mifare Classic 1K"
        })]);
        return;
      }
    }
    cb([]);
  }

//  if (self.dev.isACR122()) {
//    self.nfcreader.acr122_set_timeout(self,timeout, function() {
//      self.nfcreader.command(PN53x.InListPassiveTarget(),cmdCntx({callback:tagDetector,timeout:timeout}));
//    });
//  } else {
    self.nfcreader.command(PN53x.InListPassiveTarget(),cmdCntx({driver: self.nfcreader, callback:tagDetector,timeout:timeout}));
//  }
};



// Send transceive (0x40 -- InDataExchange), receive response.
NfcAdapter.prototype.transceive = function(tag,req, cb) {
  if (!cb) cb = defaultCallback;
  var self = this;
  self.nfcreader.command(PN53x.InDataExchange({DataOut: req}),cmdCntx({driver: self.nfcreader, callback:cb,timeout:3000}));

//  var u8 = new Uint8Array(this.makeFrame(0x40,
//                                         UTIL_concat([0x01/*Tg*/], req)));
// TODO: IF WE NEED TO CHUNK IT, IT SHOULD BE PUSHED TO ANOTHER LEVEL, SEE IF WE CAN GET AWAY WITH IT...
//  // Write out in 64 bytes frames.
//  for (var i = 0; i < u8.length; i += 64) {
//    this.dev.writeFrame(new Uint8Array(u8.subarray(i, i + 64)).buffer);
//  }

};

