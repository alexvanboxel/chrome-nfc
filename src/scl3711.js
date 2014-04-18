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
 * @fileoverview SCL3711 USB driver.
 */

'use strict';

// Global SCL3711 instance counter.
var scl3711_id = 0;

// Worker SCL3711 instances. Tied 1-on-1 to websocket worker.
function usbSCL3711() {
  this.dev = null;
  // Pick unique channel (within process..)
  this.cid = (++scl3711_id) & 0x00ffffff;
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
usbSCL3711.prototype.publicAuthentication = function(block, cb) {
  var self = this;
    self.nfcreader.publicAuthentication(self,block,cb);
}


// onclose callback gets called when device disappears.
usbSCL3711.prototype.open = function(which, cb, onclose) {
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
    if (self.dev && self.dev.isACR122()) {
      self.nfcreader = new ACR122(self.dev);

      self.nfcreader.acr122_reset_to_good_state(self,function() {
        self.nfcreader.acr122_set_buzzer(self,false, function() {
          if (callback) callback(result);
        });
      });
    } else {
      self.nfcreader = new SCL3711(self.dev);

      if (callback) callback(result);
    }
  });
};

usbSCL3711.prototype.close = function() {
  var self = this;

  /* deselect and release target if any tag is associated. */
  function deselect_release(cb) {
    self.nfcreader.command(PN53x.InDeselect(),cmdCntx({timeout:1}).setCallback(
      function() {
        self.nfcreader.command(PN53x.InRelease(),cmdCntx({timeout:1}).setCallback(
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
usbSCL3711.prototype.wait_for_passive_target = function(timeout, cb) {
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
        cb(0,"tt2");
        return;
      }
      else if (tagData.SENS_RES[0] == 0x00 && tagData.SENS_RES[1] == 0x04) {
        console.log("DEBUG: found Mifare Classic 1K (106k type A)");
        // TODO: VERY BAD WAY TO KEEP CONTEXT
        self.detected_tag = "Mifare Classic 1K";
        self.authed_sector = null;
        self.auth_key = null;
        cb(0,"mifare_classic");
        return;
      }
    }
    cb();
  }

  if (self.dev.isACR122()) {
    self.nfcreader.acr122_set_timeout(self,timeout, function() {
      self.nfcreader.command(PN53x.InListPassiveTarget(),cmdCntx({callback:tagDetector,timeout:timeout}));
    });
  } else {
    self.nfcreader.command(PN53x.InListPassiveTarget(),cmdCntx({callback:tagDetector,timeout:timeout}));
  }
};


// read a block (16-byte) from tag.
// cb(rc, data: ArrayBuffer)
usbSCL3711.prototype.read_block = function(block, cb) {
  var self = this;
  var callback = cb;
  if (!cb) cb = defaultCallback;

  /* function-wise variable */
  var u8 = new Uint8Array(2);  // Type 2 tag command
  u8[0] = 0x30;                // READ command
  u8[1] = block;               // block number

  self.apdu(u8, function (data) {
      callback(data);
  });
}


// Input:
//  data: ArrayBuffer, the type 2 tag content.
usbSCL3711.prototype.emulate_tag = function (data, timeout, cb) {
  if (!cb) cb = defaultCallback;
  var callback = cb;
  var self = this;
  var TIMEOUT = timeout;

  /*
   * Input:
   *   cmd: the TT2 command from initiator.
   */
  var HANDLE_TT2 = function (cmd) {
    switch (cmd[0]) {
      case 0x30:  /* READ */
        var blk_no = cmd[1];
        console.log("recv TT2.READ(blk_no=" + blk_no + ")");
        var ret = data.subarray(blk_no * 4, blk_no * 4 + 16);
        if (ret.length < 16) {
          ret = UTIL_concat(ret, new Uint8Array(16 - ret.length));
        }

        self.nfcreader.command(PN53x.TgResponseToInitiator({TgResponse: ret}), cmdCntx({timeout: TIMEOUT}).setCallback(
          function () {
            self.nfcreader.command(PN53x.TgGetInitiatorCommand({}), cmdCntx({timeout: TIMEOUT}).setCallback(
              function (data) {
                HANDLE_TT2(data);
              }
            ));
          }
        ));
        break;
      case 0x50:  /* HALT */
        console.log("recv TT2.HALT received.");
        callback(0);
        break;
      default:
        console.log("Unsupported TT2 tag: " + cmd[0]);
        callback(0x999);
    }
  }

  function TgInitAsTarget() {
    var req = new Uint8Array([
      0x01, // Mode: passive only
      0x04, 0x00, 0x00, 0xb0, 0x0b, 0x00, // Mifare parameter
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // Felica
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // ID3
      0x00, 0x00]);
    self.nfcreader.command(PN53x.TgInitAsTarget({Data: req}), cmdCntx({timeout: TIMEOUT}).setCallback(
      function (rc,data) {
        HANDLE_TT2(data.InitiatorCommand);
      }
    ));
  }

  if (self.dev.isACR122()) {
    self.nfcreader.setPiccOperatingParameter(self, 0x00, function () {
      // RFCA:off and RF:off
      self.nfcreader.command(PN53x.RFConfiguration({CfgItem: 0x01, ConfigurationData: [0x00]}), cmdCntx({timeout: TIMEOUT}).setCallback(
        function () {
          self.nfcreader.acr122_set_timeout(self, timeout, function () {
            TgInitAsTarget();
          });
        }));
    });
  } else {
    TgInitAsTarget();
  }
}


// Input:
//   blk_no: block number (TT2: 4-byte; Classic: 16-byte)
//   data: Uint8Array.
usbSCL3711.prototype.write_block = function(blk_no, data, cb, write_inst) {
  var callback = cb;

  if (write_inst == null) {
    write_inst = 0xA2;  // TT2 WRITE command
  }

  var u8 = new Uint8Array(2 + data.length);  // Type 2 tag command
  u8[0] = write_inst;               // WRITE command
  u8[1] = blk_no;                   // block number
  for (var i = 0; i < data.length; i++) {
    u8[2 + i] = data[i];
  }

  this.apdu(u8, function() {
    callback(0);
  });
}

// Send apdu (0x40 -- InDataExchange), receive response.
usbSCL3711.prototype.apdu = function(req, cb) {
  if (!cb) cb = defaultCallback;
  var self = this;
  self.nfcreader.command(PN53x.InDataExchange({DataOut: req}),cmdCntx({callback:cb,timeout:3000}));

//  var u8 = new Uint8Array(this.makeFrame(0x40,
//                                         UTIL_concat([0x01/*Tg*/], req)));
// TODO: IF WE NEED TO CHUNK IT, IT SHOULD BE PUSHED TO ANOTHER LEVEL, SEE IF WE CAN GET AWAY WITH IT...
//  // Write out in 64 bytes frames.
//  for (var i = 0; i < u8.length; i += 64) {
//    this.dev.writeFrame(new Uint8Array(u8.subarray(i, i + 64)).buffer);
//  }


};
