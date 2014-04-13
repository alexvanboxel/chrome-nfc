function CCID(usbDriver) {
  var pub = {};

  var RDR_to_PC_DataBlock = function (payload) {
    return [];
  };

  var RDR_to_PC_SlotStatus = function (payload) {
    return [];
  };

  var RDR_to_PC_Parameters = function (payload) {
    return [];
  };

  var RDR_to_PC_Escape = function (payload) {
    return [];
  };

  var RDR_to_PC_DataRateAndClockFrequency = function (payload) {
    return [];
  };

  var PC_TO_RDR_Escape = function (payload, cntx) {
    // header
    var apdu_len = payload.length;
    var c8 = new Uint8Array(10);             // CCID header
    c8[0] = 0x6b;                            //   PC_to_RDR_Escape
    c8[1] = (apdu_len >> 0) & 0xff;          //   LEN (little-endian)
    c8[2] = (apdu_len >> 8) & 0xff;          //
    c8[3] = (apdu_len >> 16) & 0xff;         //
    c8[4] = (apdu_len >> 24) & 0xff;         //
    c8[5] = 0x00;                            //   bSlot
    c8[6] = 0x00;                            //   bSeq
    c8[7] = 0x00;                            //   abRFU
    c8[8] = 0x00;                            //   abRFU
    c8[9] = 0x00;                            //   abRFU

    console.log(UTIL_fmt(">>> CCID >>> PC_TO_RDR_Escape.1 | 6B | LEN = " + c8[1] + " " + c8[2] + " " + c8[3] + " " + c8[4] + "  | bSlot = 00 | bSeq = 00 | abRFU = 00 00 00"));
    console.log(UTIL_fmt(">>> CCID >>> PC_TO_RDR_Escape.2 | " + UTIL_BytesToHex(payload)));
    var buffer = UTIL_concat(c8, payload).buffer;
    usbDriver.writeFrame(buffer);
  };

  var PC_TO_RDR_Raw = function (payload, cntx) {
    console.log(UTIL_fmt(">>> CCID >>> PC_TO_RDR_Raw (Pass Thru) | "+UTIL_BytesToHex(payload)));
    usbDriver.writeFrame(payload.buffer);
  };

  var PC_to_RDR_IccPowerOn = function (cntx) {
    // header

    var c8 = new Uint8Array(10);             // CCID header
    c8[0] = 0x62;                            //   PC_to_RDR_Escape
    c8[1] = 0x00;                            //   LEN (little-endian)
    c8[2] = 0x00;                            //
    c8[3] = 0x00;                            //
    c8[4] = 0x00;                            //
    c8[5] = 0x00;                            //   bSlot
    c8[6] = 0x00;                            //   bSeq
    c8[7] = 0x01;                            //   abRFU
    c8[8] = 0x00;                            //   abRFU
    c8[9] = 0x00;                            //   abRFU

    console.log(UTIL_fmt(">>> CCID >>> PC_to_RDR_IccPowerOn | 62 | LEN = 00 00 00 00 | bSlot = 00 | bSeq = 00 | abRFU = 01 00 00"));
    var buffer = c8.buffer;
    usbDriver.writeFrame(buffer);

//    var response = RDR_to_PC_DataBlock();
//    return [];
  };

  var PC_to_RDR_IccPowerff = function (payload, cntx) {
    return [];
  };

  var PC_to_RDR_GetSlotStatus = function (payload, cntx) {
    return [];
  };

  var PC_to_RDR_XfrBlock = function (payload, cntx) {
    return [];
  };

  var PC_to_RDR_GetParameters = function (payload, cntx) {
    return [];
  };

  var PC_to_RDR_ResetParameters = function (payload, cntx) {
    return [];
  };

  var PC_to_RDR_SetParameters = function (payload, cntx) {
    return [];
  };

  var PC_to_RDR_IccClock = function (payload, cntx) {
    return [];
  };

  var PC_to_RDR_T0APDU = function (payload, cntx) {
    return [];
  };

  var PC_to_RDR_Secure = function (payload, cntx) {
    return [];
  };

  var PC_to_RDR_Mechanical = function (payload, cntx) {
    return [];
  };

  var PC_to_RDR_Abort = function (payload, cntx) {
    return [];
  };

  var PC_to_RDR_SetDataRateAndClockFrequency = function (payload, cntx) {
    return [];
  }


  var PC_TO_RDR_Escape = function (payload, cntx) {
    // header
    var apdu_len = payload.length;
    var c8 = new Uint8Array(10);             // CCID header
    c8[0] = 0x6b;                            //   PC_to_RDR_Escape
    c8[1] = (apdu_len >> 0) & 0xff;          //   LEN (little-endian)
    c8[2] = (apdu_len >> 8) & 0xff;          //
    c8[3] = (apdu_len >> 16) & 0xff;         //
    c8[4] = (apdu_len >> 24) & 0xff;         //
    c8[5] = 0x00;                            //   bSlot
    c8[6] = 0x00;                            //   bSeq
    c8[7] = 0x00;                            //   abRFU
    c8[8] = 0x00;                            //   abRFU
    c8[9] = 0x00;                            //   abRFU

    console.log(UTIL_fmt(">>> CCID >>> PC_TO_RDR_Escape.1 | 6B | LEN = " + c8[1] + " " + c8[2] + " " + c8[3] + " " + c8[4] + "  | bSlot = 00 | bSeq = 00 | abRFU = 00 00 00"));
    console.log(UTIL_fmt(">>> CCID >>> PC_TO_RDR_Escape.2 | " + UTIL_BytesToHex(payload)));
    var buffer = UTIL_concat(c8, payload).buffer;
    usbDriver.writeFrame(buffer);
  };

  var PC_to_RDR_IccPowerOn = function (cntx) {
    // header

    var c8 = new Uint8Array(10);             // CCID header
    c8[0] = 0x62;                            //   PC_to_RDR_Escape
    c8[1] = 0x00;                            //   LEN (little-endian)
    c8[2] = 0x00;                            //
    c8[3] = 0x00;                            //
    c8[4] = 0x00;                            //
    c8[5] = 0x00;                            //   bSlot
    c8[6] = 0x00;                            //   bSeq
    c8[7] = 0x01;                            //   abRFU
    c8[8] = 0x00;                            //   abRFU
    c8[9] = 0x00;                            //   abRFU

    console.log(UTIL_fmt(">>> CCID >>> PC_to_RDR_IccPowerOn | 62 | LEN = 00 00 00 00 | bSlot = 00 | bSeq = 00 | abRFU = 01 00 00"));
    var buffer = c8.buffer;
    usbDriver.writeFrame(buffer);

//    this.response = RDR_to_PC_DataBlock();
//    return [];
  };

  pub.PC_TO_RDR_Raw = PC_TO_RDR_Raw;
  pub.PC_TO_RDR_Escape = PC_TO_RDR_Escape;
  pub.PC_to_RDR_IccPowerOn = PC_to_RDR_IccPowerOn;
  pub.PC_to_RDR_IccPowerff = PC_to_RDR_IccPowerff;
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