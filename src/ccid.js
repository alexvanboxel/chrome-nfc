/**
 * This object is a partial implementation of the following spec:
 * Universal Serial Bus
 * Device Class: Smart Card
 * CCID
 *  Specification for
 *  Integrated Circuit(s) Cards Interface Devices
 *  Revision 1.1
 *  April 22rd, 2005
 *
 * @param usbDriver
 * @returns {{}}
 * @constructor
 */
function CCID(usbDriver) {
  var Error = function (errno) {
    var err = {
      0xFF: {code: "CMD_ABORTED", message: "Host aborted the current activity"},
      0xFE: {code: "ICC_MUTE", message: "CCID timed out while talking to the ICC"},
      0xFD: {code: "XFR_PARITY_ERROR", message: "Parity error while talking to the ICC"},
      0xFC: {code: "XFR_OVERRUN", message: "Overrun error while talking to the ICC"},
      0xFB: {code: "HW_ERROR", message: "An all inclusive hardware error occurred"},
      0xF8: {code: "BAD_ATR_TS", message: ""},
      0xF7: {code: "BAD_ATR_TCK", message: ""},
      0xF6: {code: "ICC_PROTOCOL_NOT_SUPPORT", message: ""},
      0xF5: {code: "ICC_CLASS_NOT_SUPPORTED", message: ""},
      0xF4: {code: "PROCEDURE_BYTE_CONFLICT", message: ""},
      0xF3: {code: "DEACTIVATED_PROTOCOL", message: ""},
      0xF2: {code: "BUSY_WITH_AUTO_SEQUENCE", message: "Automatic Sequence Ongoing"},
      0xF0: {code: "PIN_TIMEOUT", message: ""},
      0xEF: {code: "PIN_CANCELLED", message: ""},
      0xE0: {code: "CMD_SLOT_BUSY", message: "A second command was sent to a slot which was already processing a command"}
    };
    if (errno in err) {
      return err[errno];
    }
  }

  var pub = {};
  var seq = 0;
  var currCntx;

  this.receivedFrame = function (frame) {
    // TODO: As the spec allows multiple concurrent commands, multiple running cntx could be allowed.
    currCntx.up(new Uint8Array(frame));
  };

  var getNextSequence = function () {
    var s = seq;
    seq = seq + 1;
    if (seq > 255) {
      seq = 0;
    }
    return s;
  };

  var assertResponse = function (f, expSeq, expCode, expName) {
    if (f.length <= 8) {
      throw {type: "CCID", message: "CCID Response is to short, expected >=8, was " + f.length + "."}
    }

    var code = f[0];
    var sequence = f[6];
    var len = f[1] + f[2] * 256 + f[3] * 256 * 256 + f[4] * 256 * 256 * 256;
    var status = f[7];
    var error = f[8];

    console.log(UTIL_fmt("<<< CCID <<< " + expName + ".1 | " + code + " | LEN = " + len + "  | bSlot = 00 | bSeq = " + sequence + " | bStatus = " + status + "  | bError = " + error + "  | bRFU = 00"));
    console.log(UTIL_fmt("<<< CCID <<< " + expName + ".2 | " + UTIL_BytesToHex(f.subarray(10))));
    if (code !== expCode) {
      throw {type: "CCID", message: "Unexpected type, expected " + expName + ", was " + f[0] + "."}
    }
    if (sequence !== expSeq) {
      throw {type: "CCID", message: "Out of sequence, expected " + expSeq + ", was " + f[6] + "."}
    }
    if (f.length !== len + 10) {
      throw {type: "CCID", message: "Length in header doesn't match frame size  " + len + 10 + ", was " + f.length + "."}
    }
    if ((status & 64) !== 0) {
      var info = Error(error);
      throw {type: "CCID", code: info.code, message: info.message}
    }
    if ((status & (128)) !== 0) {
      throw {type: "CCID", message: "Time Extension is requested"}
    }
    if (Error(error)) {
    }

  };

  var RDR_to_PC_SlotStatus = function (f, layerCntx) {
    assertResponse(f, layerCntx.seq, 0x83, "RDR_to_PC_SlotStatus");
    return f.subarray(10, f.length);
  };

  var RDR_to_PC_Parameters = function (f, layerCntx) {
    assertResponse(f, layerCntx.seq, 0x83, "RDR_to_PC_Parameters");
    return f.subarray(10, f.length);
  };

  var RDR_to_PC_Escape = function (f, layerCntx) {
    assertResponse(f, layerCntx.seq, 0x83, "RDR_to_PC_Escape");
    return f.subarray(10, f.length);
  };

  var RDR_to_PC_DataRateAndClockFrequency = function (f, layerCntx) {
    assertResponse(f, layerCntx.seq, 0x83, "RDR_to_PC_DataRateAndClockFrequency");
    return f.subarray(10, f.length);
  };

  var RDR_to_PC_DataBlock = function (f, layerCntx) {
    assertResponse(f, layerCntx.seq, 0x80, "RDR_to_PC_DataBlock");
    return f.subarray(10, f.length);
  };

  var RDR_to_PC_Raw = function (f) {
    console.log(UTIL_fmt("<<< CCID <<< PC_TO_RDR_Raw (Pass Thru) | " + UTIL_BytesToHex(f)));
    return f.subarray(10, f.length);
  };

  var PC_TO_RDR_Raw = function (payload, cmdCntx) {
    console.log(UTIL_fmt(">>> CCID >>> PC_TO_RDR_Raw (Pass Thru) | " + UTIL_BytesToHex(payload)));

    cmdCntx.pushLayer({seq: seq, handle: RDR_to_PC_Raw});
    currCntx = cmdCntx;
    usbDriver.writeFrame(payload.buffer);
  };

  var PC_TO_RDR_Escape = function (payload, cmdCntx) {
    // header
    var apdu_len = payload.length;
    var seq = getNextSequence();
    var c8 = new Uint8Array(10);             // CCID header
    c8[0] = 0x6b;                            //   PC_to_RDR_Escape
    c8[1] = (apdu_len >> 0) & 0xff;          //   LEN (little-endian)
    c8[2] = (apdu_len >> 8) & 0xff;          //
    c8[3] = (apdu_len >> 16) & 0xff;         //
    c8[4] = (apdu_len >> 24) & 0xff;         //
    c8[5] = 0x00;                            //   bSlot
    c8[6] = seq;                             //   bSeq
    c8[7] = 0x00;                            //   abRFU
    c8[8] = 0x00;                            //   abRFU
    c8[9] = 0x00;                            //   abRFU

    console.log(UTIL_fmt(">>> CCID >>> PC_TO_RDR_Escape.1 | 6B | LEN = " + c8[1] + " " + c8[2] + " " + c8[3] + " " + c8[4] + "  | bSlot = 00 | bSeq = 00 | abRFU = 00 00 00"));
    console.log(UTIL_fmt(">>> CCID >>> PC_TO_RDR_Escape.2 | " + UTIL_BytesToHex(payload)));
    var buffer = UTIL_concat(c8, payload).buffer;

    cmdCntx.pushLayer({seq: seq, handle: RDR_to_PC_Escape});
    currCntx = cmdCntx;
    usbDriver.writeFrame(buffer);
  };

  var PC_to_RDR_IccPowerOn = function (cmdCntx) {
    // header

    var seq = getNextSequence();
    var c8 = new Uint8Array(10);             // CCID header
    c8[0] = 0x62;                            //   PC_to_RDR_Escape
    c8[1] = 0x00;                            //   LEN (little-endian)
    c8[2] = 0x00;                            //
    c8[3] = 0x00;                            //
    c8[4] = 0x00;                            //
    c8[5] = 0x00;                            //   bSlot
    c8[6] = seq;                             //   bSeq
    c8[7] = 0x01;                            //   abRFU
    c8[8] = 0x00;                            //   abRFU
    c8[9] = 0x00;                            //   abRFU

    console.log(UTIL_fmt(">>> CCID >>> PC_to_RDR_IccPowerOn | 62 | LEN = 00 00 00 00 | bSlot = 00 | bSeq = 00 | abRFU = 01 00 00"));
    var buffer = c8.buffer;
    cmdCntx.pushLayer({seq: seq, handle: RDR_to_PC_DataBlock});
    currCntx = cmdCntx;
    usbDriver.writeFrame(buffer);
  };

  var PC_to_RDR_GetSlotStatus = function (payload, cmdCntx) {
  };

  var PC_to_RDR_XfrBlock = function (payload, cmdCntx) {
  };

  var PC_to_RDR_GetParameters = function (payload, cmdCntx) {
  };

  var PC_to_RDR_ResetParameters = function (payload, cmdCntx) {
  };

  var PC_to_RDR_SetParameters = function (payload, cmdCntx) {
  };

  var PC_to_RDR_IccClock = function (payload, cmdCntx) {
  };

  var PC_to_RDR_T0APDU = function (payload, cmdCntx) {
  };

  var PC_to_RDR_Secure = function (payload, cmdCntx) {
  };

  var PC_to_RDR_Mechanical = function (payload, cmdCntx) {
  };

  var PC_to_RDR_Abort = function (payload, cmdCntx) {
  };

  var PC_to_RDR_SetDataRateAndClockFrequency = function (payload, cmdCntx) {
  };

  var PC_to_RDR_IccPowerOff = function (cmdCntx) {
    // header

    var seq = getNextSequence();
    var c8 = new Uint8Array(10);             // CCID header
    c8[0] = 0x63;                            //   PC_to_RDR_IccPowerOff
    c8[1] = 0x00;                            //   LEN (little-endian)
    c8[2] = 0x00;                            //
    c8[3] = 0x00;                            //
    c8[4] = 0x00;                            //
    c8[5] = 0x00;                            //   bSlot
    c8[6] = seq;                             //   bSeq
    c8[7] = 0x01;                            //   abRFU
    c8[8] = 0x00;                            //   abRFU
    c8[9] = 0x00;                            //   abRFU

    console.log(UTIL_fmt(">>> CCID >>> PC_to_RDR_IccPowerOff | 63 | LEN = 00 00 00 00 | bSlot = 00 | bSeq = 00 | abRFU = 01 00 00"));
    var buffer = c8.buffer;
    cmdCntx.pushLayer({seq: seq, handle: RDR_to_PC_SlotStatus});
    currCntx = cmdCntx;
    usbDriver.writeFrame(buffer);
  };

  usbDriver.registerClient(this);

  pub.PC_TO_RDR_Raw = PC_TO_RDR_Raw;
  pub.PC_TO_RDR_Escape = PC_TO_RDR_Escape;
  pub.PC_to_RDR_IccPowerOn = PC_to_RDR_IccPowerOn;
  pub.PC_to_RDR_IccPowerOff = PC_to_RDR_IccPowerOff;
  pub.PC_to_RDR_GetSlotStatus = PC_to_RDR_GetSlotStatus;
  pub.PC_to_RDR_XfrBlock = PC_to_RDR_XfrBlock;
  pub.PC_to_RDR_GetParameters = PC_to_RDR_GetParameters;
  pub.PC_to_RDR_ResetParameters = PC_to_RDR_ResetParameters;
  pub.PC_to_RDR_SetParameters = PC_to_RDR_SetParameters;
  pub.PC_to_RDR_IccClock = PC_to_RDR_IccClock;
  pub.PC_to_RDR_T0APDU = PC_to_RDR_T0APDU;
  pub.PC_to_RDR_Secure = PC_to_RDR_Secure;
  pub.PC_to_RDR_Mechanical = PC_to_RDR_Mechanical;
  pub.PC_to_RDR_Abort = PC_to_RDR_Abort;
  pub.PC_to_RDR_SetDataRateAndClockFrequency = PC_to_RDR_SetDataRateAndClockFrequency;

  return pub;
}