function ACR122(dev) {
  var self = this;
  this.usb = dev;
  this.ccid = new CCID(dev);

  this.command = function (adpu, callback) {

    if (adpu.getCmdType() == 1) {

      payload = adpu.make();

      var pseudo = new Uint8Array(5);              // Pseudo-APDU
      pseudo[0] = 0xFF;                            //   Class
      pseudo[1] = 0x00;                            //   INS (fixed 0)
      pseudo[2] = 0x00;                            //   P1 (fixed 0)
      pseudo[3] = 0x00;                            //   P2 (fixed 0)
      pseudo[4] = payload.length;                   //   Lc (Number of Bytes to send)

      console.log(UTIL_fmt(">>> ACR122 >>> Pseudo PN53x | Class = FF | INS = 00 | P1 = 00 | P2 = 00 | Lc = " + payload.length + " | " + UTIL_BytesToHex(payload)));
      self.ccid.PC_TO_RDR_Escape(UTIL_concat(pseudo, payload), callback);
    }
  }

}

// JUST MOVED, need more refactoring
ACR122.prototype.acr122_reset_to_good_state = function (rwloop, cb) {
  var self = this;
  var callback = cb;

  console.log(UTIL_fmt(">>> ACR122 >>> ResetToGoodState | 00 00 FF 00 FF 00"));
  self.ccid.PC_TO_RDR_Escape(new Uint8Array([
    0x00, 0x00, 0xff, 0x00, 0xff, 0x00]));
  rwloop.ccid_read(100, function (rc, data) {
    // icc_power_on
    self.ccid.PC_to_RDR_IccPowerOn()
    rwloop.ccid_read(100, function (rc, data) {
      if (callback) window.setTimeout(function () {
        callback();
      }, 100);
    });
  });
}

// JUST MOVED, need more refactoring
// set the beep on/off
ACR122.prototype.acr122_set_buzzer = function (rwloop, enable, cb) {
  var self = this;
  var callback = cb;
  var buzz = (enable) ? 0xff : 0x00;

  console.log(UTIL_fmt(">>> ACR122 >>> SetBuzzer | Class = FF | INS = 00 | P = 52 " + buzz + " | Lc = 00"));
  var payload = new Uint8Array([
    0xff,
    0x00,
    0x52,
    buzz,
    0x00
  ]);
  self.ccid.PC_TO_RDR_Escape(payload);

  rwloop.ccid_read(100, function (rc, data) {
    if (callback) callback(rc, data);
  });


}

// JUST MOVED, need more refactoring
ACR122.prototype.acr122_load_authentication_keys = function (rwloop, key, loc, cb) {
  var self = this;
  var callback = cb;

  if (key == null) key = self.KEYS[0];
  else if (typeof key != "object") key = rwloop.KEYS[key];

  console.log(UTIL_fmt(">>> ACR122 >>> LoadAuthenticationKey.1 | Class = FF | INS = 82 | P = 00 " + loc + " | Lc = 06"));
  console.log(UTIL_fmt(">>> ACR122 >>> LoadAuthenticationKey.2 | " + UTIL_BytesToHex(key)));

  var payload = new Uint8Array([
    0xff, 0x82, /* INS: Load Authentication Keys */
    0x00, /* P1: Key Structure: volatile memory */
    loc, /* P2: Key Number (key location): 0 or 1 */
    0x06]);
  payload = UTIL_concat(payload, key);
  self.ccid.PC_TO_RDR_Escape(payload);

  rwloop.ccid_read(100, function (rc, data) {
    if (callback) callback(rc, data);
  });
}

// JUST MOVED, need more refactoring
/* the 'block' is in 16-bytes unit. */
ACR122.prototype.acr122_authentication = function (rwloop, block, loc, type, cb) {
  var self = this;
  var callback = cb;

  console.log(UTIL_fmt(">>> ACR122 >>> Authentication.1 | Class = FF | INS = 86 | P = 00 00 | Lc = 05"));
  console.log(UTIL_fmt(">>> ACR122 >>> Authentication.2 | Version = 00 | Block = " + block + " | Type = " + type + " | Loc = " + loc));
  self.ccid.PC_TO_RDR_Escape(new Uint8Array([
    0xff, 0x86, /* INS: Authentication */
    0x00, /* P1: */
    0x00, /* P2: */
    0x05, /* Lc: 5 bytes (Authentication Data Bytes) */
    0x01, /* Version */
    0x00, /* 0x00 */
    block, /* Block number */
    type, /* Key type: TYPE A (0x60) or TYPE B (0x61) */
    loc    /* Key number (key location): 0 or 1 */
  ]));

  rwloop.ccid_read(100, function (rc, data) {
    if (callback) callback(rc, data);
  });
};

// JUST MOVED, need more refactoring
/* For Mifare Classic only. The 'block' is in 16-bytes unit. */
ACR122.prototype.publicAuthentication = function (rwloop, block, cb) {
  var self = this;
  var callback = cb;
  var sector = Math.floor(block / 4);

  function try_keyA(k) {
    var ki = k;  // for closure
    if (ki >= 3) {  // failed authentication
      if (callback) callback(0xfff);
      return;
    }
    self.acr122_load_authentication_keys(rwloop, ki, 0, function (rc, data) {
      if (rc) return;
      self.acr122_authentication(rwloop, block, 0, 0x60/*KEY A*/, function (rc, data) {
        if (rc) return try_keyA(ki + 1);
        rwloop.authed_sector = sector;
        rwloop.auth_key = rwloop.KEYS[ki];

        // try_keyB(): always the default key
        self.acr122_load_authentication_keys(rwloop, rwloop.KEYS[0], 1,
          function (rc, data) {
            self.acr122_authentication(rwloop, block, 1, 0x61/*KEY B*/,
              function (rc, data) {
                if (callback) callback(rc, data);
              });
          });
      });
    });
  }

  if (rwloop.detected_tag == "Mifare Classic 1K") {
    if (rwloop.authed_sector != sector) {
      console.log("[DEBUG] Public Authenticate sector " + sector);
      try_keyA(0);
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
      self.acr122_load_authentication_keys(rwloop, key, 1,
        function (rc, data) {
          self.acr122_authentication(rwloop, block, 1, 0x61/*KEY B*/,
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
  var callback = cb;

  var unit = Math.ceil(timeout / 5);
  if (unit >= 0xff) unit = 0xff;

  console.log(UTIL_fmt(">>> ACR122 >>> Set Timeout to " + unit * 5 + " secs | Class = FF | INS = 00 | P1 = 41 | P2 = " + unit + " | Lc = 00"));
  self.ccid.PC_TO_RDR_Escape(new Uint8Array([0xff, 0x00, 0x41, unit, 0x00]));

  rwloop.ccid_read(100, function (rc, data) {
    if (callback) callback(rc, data);
  });
}
