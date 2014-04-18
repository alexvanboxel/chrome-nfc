var ACR = {
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

ACR.Command = function() {

}


ACR.PseudoADPU = function (spec) {
  var Type = 2;
  var Data = spec.Data;

  var that = {};

  that.getCmdType = function () {
    return Type;
  }

  that.make = function () {
    return new UTIL_concat(new Uint8Array([0xFF, 0x00, 0x00, 0x00, Data.length]), Data);
  }

  that.response = function (f) {
    if (f.length < 2) {
      throw {type: "ACR", message: "Frame should be at least 2 bytes for status."}
    }
    console.log(UTIL_fmt("<<< ACR <<< Pseudo ADPU.1 | "+UTIL_BytesToHex(f.subarray(0, f.length-2))));
    console.log(UTIL_fmt("<<< ACR <<< Pseudo ADPU.2 | SW1 = " +f[f.length-2] + " SW2 = " +f[f.length-1]));
    if ( (f[f.length-2] === 0x63) && (f[f.length-1] === 0x00) ) {
      throw {type: "ACR", message: "ACR operation failed."}
    }
    if ( (f[f.length-2] === 0x90) && (f[f.length-1] === 0x00) ) {
      return f.subarray(0, f.length-2);
    }
    throw {type: "ACR", message: "Unexpected ACR status SW1 = " +f[f.length-2] + " SW2 = " +f[f.length-1]};
  }

  that.debug = function () {
    console.log(UTIL_fmt(">>> ACR >>> Pseudo ADPU.1 | Class = FF | INS = 00 | P = 00 00 | Lc = "+Data.length));
    console.log(UTIL_fmt(">>> ACR >>> Pseudo ADPU.2 | " + UTIL_BytesToHex(Data)));
  }

  return that;
};


ACR.LoadAuthenticationKey = function (spec) {
  var Type = 2;
  var Loc = spec.Loc;
  var Key = spec.Key;

  var that = {};

  that.getCmdType = function () {
    return Type;
  }

  that.make = function () {
    return new UTIL_concat(new Uint8Array([0xFF, 0x82, 0x00, Loc, 0x06]), Key);
  }

  that.response = function (f) {
    if (f.length < 2) {
      throw {type: "ACR", message: "Frame should be at least 2 bytes for status."}
    }
    console.log(UTIL_fmt("<<< ACR <<< LoadAuthenticationKey.1 | "+UTIL_BytesToHex(f.subarray(0, f.length-2))));
    console.log(UTIL_fmt("<<< ACR <<< LoadAuthenticationKey.2 | SW1 = " +f[f.length-2] + " SW2 = " +f[f.length-1]));
    if ( (f[f.length-2] === 0x63) && (f[f.length-1] === 0x00) ) {
      throw {type: "ACR", message: "ACR operation failed."}
    }
    if ( (f[f.length-2] === 0x90) && (f[f.length-1] === 0x00) ) {
      return f.subarray(0, f.length-2);
    }
    throw {type: "ACR", message: "Unexpected ACR status SW1 = " +f[f.length-2] + " SW2 = " +f[f.length-1]};
  }

  that.debug = function () {
    console.log(UTIL_fmt(">>> ACR >>> LoadAuthenticationKey.1 | Class = FF | INS = 82 | P = 00 " + Loc + " | Lc = 06"));
    console.log(UTIL_fmt(">>> ACR >>> LoadAuthenticationKey.2 | " + UTIL_BytesToHex(Key)));
  }

  return that;
};

ACR.Authentication = function (spec) {
  var CmdType = 2;
  var Loc = spec.Loc;
  var Block = spec.Block;
  var Type = spec.Type;

  var that = {};

  that.getCmdType = function () {
    return CmdType;
  }

  that.make = function () {
    return new Uint8Array([
      0xff, 0x86, /* INS: Authentication */
      0x00, /* P1: */
      0x00, /* P2: */
      0x05, /* Lc: 5 bytes (Authentication Data Bytes) */
      0x01, /* Version */
      0x00, /* 0x00 */
      Block, /* Block number */
      Type, /* Key type: TYPE A (0x60) or TYPE B (0x61) */
      Loc    /* Key number (key location): 0 or 1 */
    ]);
  }

  that.response = function (f) {
    if (f.length < 2) {
      throw {type: "ACR", message: "Frame should be at least 2 bytes for status."}
    }
    console.log(UTIL_fmt("<<< ACR <<< Authentication.1 | "+UTIL_BytesToHex(f.subarray(0, f.length-2))));
    console.log(UTIL_fmt("<<< ACR <<< Authentication.2 | SW1 = " +f[f.length-2] + " SW2 = " +f[f.length-1]));
    if ( (f[f.length-2] === 0x63) && (f[f.length-1] === 0x00) ) {
      throw {type: "ACR", message: "ACR operation failed."}
    }
    if ( (f[f.length-2] === 0x90) && (f[f.length-1] === 0x00) ) {
      return f.subarray(0, f.length-2);
    }
    throw {type: "ACR", message: "Unexpected ACR status SW1 = " +f[f.length-2] + " SW2 = " +f[f.length-1]};
  }

  that.debug = function () {
    console.log(UTIL_fmt(">>> ACR >>> Authentication.1 | Class = FF | INS = 86 | P = 00 00 | Lc = 05"));
    console.log(UTIL_fmt(">>> ACR >>> Authentication.2 | Version = 00 | Block = " + Block + " | Type = " + Type + " | Loc = " + Loc));
  }

  return that;
};
