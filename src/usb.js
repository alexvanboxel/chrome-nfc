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
 * @fileoverview Low level usb driver.
 */

'use strict';

// Low level 'driver'. One per physical USB device.
function usbDriver(usbHandle, spec) {
  var txqueue = [];
  var clients = [];
  var vendorId = spec.vendorId;
  var productId = spec.productId;
  var endInput = spec.endInput;
  var endOutput = spec.endOutput;
  var endInterrupt = spec.endInterrupt;

  // TODO: Need to remove this...
  var isACR122 = function () {
    return vendorId == 0x072f;
  };

  var readLoop = function () {
    if (!usbHandle) return;

    console.log(UTIL_fmt('||| USB ||| Entering BULK IN read loop'));

    var self = this;
    chrome.usb.bulkTransfer(
      usbHandle,
      { direction: 'in', endpoint: endInput, length: 2048 },
      function (x) {
        if (x.data) {
          if (x.data.byteLength >= 5) {

            var u8 = new Uint8Array(x.data);
            console.log(UTIL_fmt('<<< USB <<< ' + UTIL_BytesToHex(u8)));

            // Read more.
            window.setTimeout(function () {
              readLoop();
            }, 0);
// TODO : Maybe do try/catch...
            publishFrame(x.data);

//            // Read more.
//            window.setTimeout(function () {
//              readLoop();
//            }, 0);
          } else {
            console.log(UTIL_fmt('ReadLoop: tiny reply!'));
            console.log(x);
            window.setTimeout(function () {
              self.close();
            }, 0);
          }

        } else {
          console.log('no x.data!');
          console.log(x);
          throw 'no x.data!';
        }
      }
    );
  };

  var notifyClientOfClosure = function (client) {
    var cb = client.onclose;
    if (cb) window.setTimeout(cb, 0);
  };

  // Stuffs all queued frames from txqueue[] to device.
  var writePump = function () {
    if (!usbHandle) return;  // Ignore.

    if (txqueue.length == 0) return;  // Done with current queue.

    var frame = txqueue[0];

    function transferComplete(x) {
      txqueue.shift();  // drop sent frame from queue.
      if (txqueue.length != 0) {
        window.setTimeout(function () {
          writePump();
        }, 0);
      }
    }

    var u8 = new Uint8Array(frame);
    console.log(UTIL_fmt('>>> USB >>> ' + UTIL_BytesToHex(u8)));

    chrome.usb.bulkTransfer(
      usbHandle,
      {direction: 'out', endpoint: endOutput, data: frame},
      transferComplete
    );
  };

  var close = function () {
    // Tell clients.
    while (clients.length != 0) {
      notifyClientOfClosure(clients.shift());
    }

    // Tell global list to drop this device.
    dev_manager.dropDevice(this);
  };

  var publishFrame = function (f) {
    // Push frame to all clients.
    var old = clients;

    var remaining = [];
    var changes = false;
    for (var i = 0; i < old.length; ++i) {
      var client = old[i];
      if (client.receivedFrame(f)) {
        // Client still alive; keep on list.
        remaining.push(client);
      } else {
        changes = true;
        console.log(UTIL_fmt(
            '[' + client.cid.toString(16) + '] left?'));
      }
    }
    if (changes) clients = remaining;
  };


  // Register an opener.
  var registerClient = function (who) {
    clients.push(who);
  };

  // De-register an opener.
  // Returns number of remaining listeners for this device.
  var deregisterClient = function (who) {
    var current = clients;
    clients = [];
    for (var i = 0; i < current.length; ++i) {
      var client = current[i];
      if (client != who) clients.push(client);
    }
    return clients.length;
  };

  // Queue frame to be sent.
  // If queue was empty, start the write pump.
  // Returns false if device is MIA.
  var writeFrame = function (frame) {
    if (!usbHandle) return false;

    var wasEmpty = (txqueue.length == 0);
    txqueue.push(frame);
    if (wasEmpty) writePump();

    return true;
  };

  // start readLoop and return public methods
  readLoop();

  var pub = {};
  // deprecated methpd
  pub.isACR122 = isACR122;
  // public methods
  pub.registerClient = registerClient;
  pub.deregisterClient = deregisterClient;
  pub.writeFrame = writeFrame;
  pub.close = close;
  return pub;
}


