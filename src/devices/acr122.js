function ACR122(usbDriver) {

  // TEMP
  this.vendorId = 0x072f;
  this.productId = 0x2200;

  var self = this;
  this.usb = usbDriver;
  this.ccid = CCID(usbDriver);

  this.command = function (adpu, cntx) {
    adpu.debug();
    cntx.pushHandle(adpu.response);

    if (adpu.getCmdType() == 1) {
      this.command(ACR.PseudoADPU({Data:adpu.make()}),cntx);
    }
    else if (adpu.getCmdType() == 2) {
      self.ccid.PC_TO_RDR_Escape(adpu.make(), cntx);
    }
  }
}

// JUST MOVED, need more refactoring
ACR122.prototype.acr122_reset_to_good_state = function (rwloop, cb) {
  var self = this;

  console.log(UTIL_fmt(">>> ACR122 >>> ResetToGoodState | 00 00 FF 00 FF 00"));
  self.ccid.PC_TO_RDR_Escape(new Uint8Array([
    0x00, 0x00, 0xff, 0x00, 0xff, 0x00]), cmdCntx({timeout: 100}).setCallback(
    function () {
      self.ccid.PC_to_RDR_IccPowerOn(cmdCntx({timeout: 100}).setCallback(cb))
    }
  ));
};

// JUST MOVED, need more refactoring
// set the beep on/off
ACR122.prototype.acr122_set_buzzer = function (rwloop, enable, cb) {
  var self = this;
  var buzz = (enable) ? 0xff : 0x00;

  console.log(UTIL_fmt(">>> ACR122 >>> SetBuzzer | Class = FF | INS = 00 | P = 52 " + buzz + " | Lc = 00"));
  var payload = new Uint8Array([
    0xff,
    0x00,
    0x52,
    buzz,
    0x00
  ]);
  self.ccid.PC_TO_RDR_Escape(payload,cmdCntx({timeout: 100}).setCallback(cb));
};

// JUST MOVED, need more refactoring
ACR122.prototype.acr122_load_authentication_keys = function (key, loc, cb) {
  this.command(ACR.LoadAuthenticationKey({Loc:loc,Key:key}),cmdCntx({timeout: 100}).setCallback(cb));
};

// JUST MOVED, need more refactoring
/* the 'block' is in 16-bytes unit. */
ACR122.prototype.acr122_authentication = function (block, loc, type, cb) {
  this.command(ACR.Authentication({Loc:loc,Block:block,Type:type}),cmdCntx({timeout: 100}).setCallback(cb));
};

// JUST MOVED, need more refactoring
/* For Mifare Classic only. The 'block' is in 16-bytes unit. */
ACR122.prototype.publicAuthentication = function (rwloop, block, cb) {
  var self = this;
  var callback = cb;
  var sector = Math.floor(block / 4);

  var bruteForce = [];
  bruteForce.push({loc: 0, key: rwloop.KEYS[0], type: 0x60/*KEY A*/});
  bruteForce.push({loc: 0, key: rwloop.KEYS[1], type: 0x60/*KEY A*/});
  bruteForce.push({loc: 0, key: rwloop.KEYS[2], type: 0x60/*KEY A*/});
  bruteForce.push({loc: 1, key: rwloop.KEYS[0], type: 0x61/*KEY B*/});

  var tryKey = function () {
    var current = bruteForce.shift();

    self.command(ACR.LoadAuthenticationKey({Loc: current.loc, Key: current.key}), cmdCntx({timeout: 100})
      .setCallback(function () {
        self.command(ACR.Authentication({Loc: current.loc, Block: block, Type: current.type}), cmdCntx({timeout: 100})
          .setCallback(function () {
            rwloop.authed_sector = sector;
            rwloop.auth_key = current.key;
            if (callback) callback(0, null);
          })
          .onError(function (e) {
            if (bruteForce.length > 0) {
              tryKey();
            }
            else {
              console.error(e);
            }
          }
        ))
      })
      .onError(function (e) {
        if (bruteForce.length > 0) {
          tryKey();
        }
        else {
          console.error(e);
        }
      }))
  };

  if (rwloop.detected_tag == "Mifare Classic 1K") {
    if (rwloop.authed_sector != sector) {
      console.log("[DEBUG] Public Authenticate sector " + sector);
      tryKey();
    } else {
      if (callback) callback(0, null);
    }
  } else {
    if (callback) callback(0, null);
  }
};

// JUST MOVED, need more refactoring
/* For Mifare Classic only. The 'block' is in 16-bytes unit. */
ACR122.prototype.privateAuthentication = function (rwloop, block, key, cb) {
  var self = this;
  var callback = cb;
  var sector = Math.floor(block / 4);

  if (self.detected_tag == "Mifare Classic 1K") {
    if (self.authed_sector != sector) {
      console.log("[DEBUG] Private Authenticate sector " + sector);
      self.acr122_load_authentication_keys(key, 1,
        function () {
          self.acr122_authentication(block, 1, 0x61/*KEY B*/,
            function (rc, data) {
              if (rc) {
                console.log("KEY B AUTH ERROR");
                return rc;
              }
              if (callback) callback(rc, data);
            });
        });
    } else {
      if (callback) callback(0, null);
    }
  } else {
    if (callback) callback(0, null);
  }
};

// JUST MOVED, need more refactoring
ACR122.prototype.acr122_set_timeout = function (rwloop, timeout /* secs */, cb) {
  var self = this;

  var unit = Math.ceil(timeout / 5);
  if (unit >= 0xff) unit = 0xff;

  console.log(UTIL_fmt(">>> ACR122 >>> Set Timeout to " + unit * 5 + " secs | Class = FF | INS = 00 | P1 = 41 | P2 = " + unit + " | Lc = 00"));
  self.ccid.PC_TO_RDR_Escape(new Uint8Array([0xff, 0x00, 0x41, unit, 0x00]),cmdCntx({timeout:100}).setCallback(cb));
};

// JUST MOVED, need more refactoring
ACR122.prototype.setPiccOperatingParameter = function (rwloop, param, cb) {
  var self = this;

  console.log(UTIL_fmt(">>> ACR122 >>> Set PICC Operating Parameter to " + param + " | Class = FF | INS = 00 | P1 = 51 | P2 = " + param + " | Lc = 00"));
  self.ccid.PC_TO_RDR_Escape(new Uint8Array([0xff, 0x00, 0x41, param, 0x00]),cmdCntx({timeout:100}).setCallback(cb));
};


ACR122.prototype.isACR122 = function() { return true; };


