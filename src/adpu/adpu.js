var PN53x = {
  Status: function (errno) {
    var err = {
      0x01: "time out, the target has not answered",
      0x02: "checksum error during rf communication",
      0x03: "parity error during rf communication",
      0x04: "erroneous bit count in anticollision",
      0x05: "framing error during mifare operation",
      0x06: "abnormal bit collision in 106 kbps anticollision",
      0x07: "insufficient communication buffer size",
      0x09: "rf buffer overflow detected by ciu",
      0x0a: "rf field not activated in time by active mode peer",
      0x0b: "protocol error during rf communication",
      0x0d: "overheated - antenna drivers deactivated",
      0x0e: "internal buffer overflow",
      0x10: "invalid command parameter",
      0x12: "unsupported command from initiator",
      0x13: "format error during rf communication",
      0x14: "mifare authentication error",
      0x18: "not support NFC secure",
      0x19: "i2c bus line is busy",
      0x23: "wrong uid check byte (14443-3)",
      0x25: "command invalid in current dep state",
      0x26: "operation not allowed in this configuration",
      0x27: "not acceptable command due to context",
      0x29: "released by initiator while operating as target",
      0x2a: "card ID does not match",
      0x2b: "the card previously activated has disapperaed",
      0x2c: "Mismatch between NFCID3 initiator and target in DEP 212/424 kbps",
      0x2d: "Over-current event has been detected",
      0x2e: "NAD missing in DEP frame",
      0x2f: "deselected by initiator while operating as target",
      0x31: "initiator rf-off state detected in passive mode",
      0x7F: "pn53x application level error"
    };
    if (errno in err) {
      return "[" + errno + "] " + err[errno];
    } else {
      return "Unknown error: " + errno;
    }
  }

};

PN53x.InListPassiveTarget = function () {
  var MaxTg = 0x01;
  var BrTy = 0x00;
  var InitiatorData = null;

  var self = this;
  var that = Command.controllerCommand();

  that.make = function () {
    return new Uint8Array([0xD4, 0x4A, MaxTg, BrTy]);
  }

  that.response = function (f) {
    if (f[0] != 0xD5) {
      throw {type: "PN53xException", message: "Response is not an PN53x response."}
    }
    if (f[1] != 0x4B) {
      throw {type: "PN53xException", message: "Expected 0x4B (InListPassiveTarget reply), but was " + f[1]}
    }
    console.log(UTIL_fmt("<<< PN53x <<< InListPassiveTarget.1 | " + UTIL_BytesToHex(f)));
    var tags = []
    var NbTg = f[2];
    var o = 3;
    for (var tg = 0; tg < NbTg; tg++) {
      // TODO: We only assume ONE TAG and TYPE 1 tag
      var tagData = {}
      tagData.Tg = f[o];
      tagData.SENS_RES = f.subarray(o + 1, o + 1 + 2);
      tagData.SEL_RES = f[o + 3];
      tagData.NFCIDLength = f[o + 4];
      tagData.NFCID1 = f.subarray(o + 5, o + 5 + tagData.NFCIDLength);
      tagData.ATS = f.subarray(o + 5 + tagData.NFCIDLength + 1, o + 5 + tagData.NFCIDLength + 1 + f[o + 5 + tagData.NFCIDLength + 1] - 1);
      tags.push(tagData);
      console.log(tagData);
    }

    return {Data:tags,Pop:true};
  }

  that.debug = function () {
    var BrTyOut = function (val) {
      switch (val) {
        case 0x00:
          return "'0x00: 106 kbps type A (ISO/IEC14443 Type A)'";
        case 0x01:
          return "'0x01: 212 kbps (FeliCa polling)'";
        case 0x02:
          return "'0x02: 424 kbps (FeliCa polling)'";
        case 0x03:
          return "'0x03: 106 kbps type B (ISO/IEC14443-3B)'";
        case 0x04:
          return "'0x04: 106 kbps Innovision Jewel tag'";
      }
    }

    console.log(UTIL_fmt(">>> PN53x >>> InListPassiveTarget.1 | D4 4A | MaxTg = " + MaxTg + " | BrTy = " + BrTyOut(BrTy)));
    console.log(UTIL_fmt(">>> PN53x >>> InListPassiveTarget.2 | InitiatorData:" + UTIL_BytesToHexWithSeparator(InitiatorData)));
  }

  return that;
};


PN53x.InDeselect = function () {
  var Tg = 0x01;

  var self = this;
  var that = Command.controllerCommand();

  that.make = function () {
    return new Uint8Array([0xD4, 0x44, Tg]);
  }

  that.response = function (frame) {

  }

  that.debug = function () {
    console.log(UTIL_fmt(">>> PN53x >>> InDeselect | D4 44 | Tg = " + Tg));
  }
  return that;
};


PN53x.InRelease = function () {
  var Tg = 0x01;

  var self = this;
  var that = Command.controllerCommand();


  that.make = function () {
    return new Uint8Array([0xD4, 0x52, Tg]);
  }

  that.response = function (frame) {

  }

  that.debug = function () {
    console.log(UTIL_fmt(">>> PN53x >>> InRelease | D4 52 | Tg = " + Tg));
  }
  return that;
};

PN53x.InDataExchange = function (spec) {
  var Tg = 0x01;
  var DataOut = spec.DataOut;

  var self = this;
  var that = Command.controllerCommand();

  that.make = function () {
    return new UTIL_concat(new Uint8Array([0xD4, 0x40, Tg]), DataOut);
  }

  that.response = function (f) {
    if (f[0] != 0xD5) {
      throw {type: "PN53xException", message: "Response is not an PN53x response."}
    }
    if (f[1] != 0x41) {
      throw {type: "PN53xException", message: "Expected 0x41 (InDataExchange reply), but was " + f[1]}
    }
    console.log(UTIL_fmt("<<< PN53x <<< InDataExchange.1 | " + UTIL_BytesToHex(f)));

    if (f[2] != 0x00) {
      throw {type: "PN53xException", message: self.Status(f[2])}
    }
    return {Data:(f.subarray(3)),Pop:true};
  }

  that.debug = function () {
    console.log(UTIL_fmt(">>> PN53x >>> InDataExchange | D4 40 | Tg = " + Tg + " | " + UTIL_BytesToHex(DataOut)));
  }

  return that;
};

PN53x.InCommunicateThru = function (spec) {
  var DataOut = spec.DataOut;

  var self = this;
  var that = Command.controllerCommand();

  that.make = function () {
    return new UTIL_concat(new Uint8Array([0xD4, 0x42]), DataOut);
  }

  that.response = function (f) {
    if (f[0] != 0xD5) {
      throw {type: "PN53xException", message: "Response is not an PN53x response."}
    }
    if (f[1] != 0x43) {
      throw {type: "PN53xException", message: "Expected 0x43 (InCommunicateThru reply), but was " + f[1]}
    }
    console.log(UTIL_fmt("<<< PN53x <<< InCommunicateThru.1 | " + UTIL_BytesToHex(f)));

    if (f[2] != 0x00) {
      throw {type: "PN53xException", message: self.Status(f[2])}
    }
    return {Data:(f.subarray(3)),Pop:true};
  }

  that.debug = function () {
    console.log(UTIL_fmt(">>> PN53x >>> InCommunicateThru | D4 42 | " + UTIL_BytesToHex(DataOut)));
  }

  return that;
};

PN53x.TgInitAsTarget = function (spec) {
  var Data = spec.Data;

  var self = this;
  var that = Command.controllerCommand();


  that.make = function () {
    return new UTIL_concat(Uint8Array([0xD4, 0x8C]), Data);
  }

  that.response = function (f) {
    if (f[0] != 0xD5) {
      throw {type: "PN53xException", message: "Response is not an PN53x response."}
    }
    if (f[1] != 0x8D) {
      throw {type: "PN53xException", message: "Expected 0x8D (TgInitAsTarget reply), but was " + f[1]}
    }
    console.log(UTIL_fmt("<<< PN53x <<< TgInitAsTarget.1 | " + UTIL_BytesToHex(f)));
    var data = {}
    data.Mode = f[2];
    data.InitiatorCommand = f.subarray(3);
    console.log(data);
    return {Data:data,Pop:true};
  }

  that.debug = function () {
    console.log(UTIL_fmt(">>> PN53x >>> TgInitAsTarget.1 | D4 8C | " + UTIL_BytesToHex(Data)));
  }

  return that;
};

PN53x.TgGetInitiatorCommand = function () {
  var self = this;
  var that = Command.controllerCommand();


  that.make = function () {
    return new Uint8Array([0xD4, 0x88, Tg]);
  }

  that.response = function (frame) {
    if (f[0] != 0xD5) {
      throw {type: "PN53xException", message: "Response is not an PN53x response."}
    }
    if (f[1] != 0x89) {
      throw {type: "PN53xException", message: "Expected 0x89 (TgGetInitiatorCommand reply), but was " + f[1]}
    }
    console.log(UTIL_fmt("<<< PN53x <<< TgGetInitiatorCommand.1 | " + UTIL_BytesToHex(f)));

    if (f[2] != 0x00) {
      throw {type: "PN53xException", message: self.Status(f[2])}
    }
    return {Data:(f.subarray(3)),Pop:true};
  }

  that.debug = function () {
    console.log(UTIL_fmt(">>> PN53x >>> TgGetInitiatorCommand | D4 88"));
  }
  return that;
};

PN53x.TgResponseToInitiator = function (spec) {
  var TgResponse = spec.TgResponse;

  var self = this;
  var that = Command.controllerCommand();


  that.make = function () {
    return new UTIL_concat(new Uint8Array([0xD4, 0x90]), TgResponse);
  }

  that.response = function (f) {
    if (f[0] != 0xD5) {
      throw {type: "PN53xException", message: "Response is not an PN53x response."}
    }
    if (f[1] != 0x91) {
      throw {type: "PN53xException", message: "Expected 0x41 (TgResponseToInitiator reply), but was " + f[1]}
    }
    console.log(UTIL_fmt("<<< PN53x <<< TgResponseToInitiator.1 | " + UTIL_BytesToHex(f)));

    if (f[2] != 0x00) {
      throw {type: "PN53xException", message: self.Status(f[2])}
    }
    return {Data:null,Pop:true};
  }

  that.debug = function () {
    console.log(UTIL_fmt(">>> PN53x >>> TgResponseToInitiator | D4 90 | " + UTIL_BytesToHex(TgResponse)));
  }

  return that;
};

PN53x.RFConfiguration = function (spec) {
  var CfgItem = spec.CfgItem;
  var ConfigurationData = spec.ConfigurationData;

  var self = this;
  var that = Command.controllerCommand();


  that.make = function () {
    return new UTIL_concat(new Uint8Array([0xD4, 0x32, CfgItem]), ConfigurationData);
  }

  that.response = function (f) {
    if (f[0] != 0xD5) {
      throw {type: "PN53xException", message: "Response is not an PN53x response."}
    }
    if (f[1] != 0x33) {
      throw {type: "PN53xException", message: "Expected 0x41 (RFConfiguration reply), but was " + f[1]}
    }
    console.log(UTIL_fmt("<<< PN53x <<< RFConfiguration.1 | " + UTIL_BytesToHex(f)));

    if (f[2] != 0x00) {
      throw {type: "PN53xException", message: self.Status(f[2])}
    }
    return {Data:null,Pop:true};
  }

  that.debug = function () {
    console.log(UTIL_fmt(">>> PN53x >>> RFConfiguration | D4 32 | CfgIten = " + CfgItem + " | " + UTIL_BytesToHex(ConfigurationData)));
  }

  return that;
};

