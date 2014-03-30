function CCID(dev) {
  this.usb = dev;

  this.RDR_to_PC_DataBlock = function (payload) {
    return [];
  };

  this.RDR_to_PC_SlotStatus = function (payload) {
    return [];
  };

  this.RDR_to_PC_Parameters = function (payload) {
    return [];
  };

  this.RDR_to_PC_Escape = function (payload) {
    return [];
  };

  this.RDR_to_PC_DataRateAndClockFrequency = function (payload) {
    return [];
  };

  this.PC_TO_RDR_Escape = function (payload, callback) {
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

    console.log(UTIL_fmt(">>> CCID >>> PC_TO_RDR_Escape.1 | 6B | LEN = " + c8[1] + " " + c8[2] + " " + c8[3] + " " + c8[4] + "  | INS = 00 | bSlot = 00 | bSeq = 00 | abRFU = 00 00 00"));
    console.log(UTIL_fmt(">>> CCID >>> PC_TO_RDR_Escape.2 | " + UTIL_BytesToHex(payload)));
    var buffer = UTIL_concat(c8, payload).buffer;
    this.usb.writeFrame(buffer);
//    this.usb.read(1000, callback);
  };

  this.PC_to_RDR_IccPowerOn = function (payload) {
    this.response = RDR_to_PC_DataBlock();
    return [];
  };

  this.PC_to_RDR_IccPowerff = function (payload) {
    return [];
  };

  this.PC_to_RDR_GetSlotStatus = function (payload) {
    return [];
  };

  this.PC_to_RDR_XfrBlock = function (payload) {
    return [];
  };

  this.PC_to_RDR_GetParameters = function (payload) {
    return [];
  };

  this.PC_to_RDR_ResetParameters = function (payload) {
    return [];
  };

  this.PC_to_RDR_SetParameters = function (payload) {
    return [];
  };

  this.PC_to_RDR_IccClock = function (payload) {
    return [];
  };

  this.PC_to_RDR_T0APDU = function (payload) {
    return [];
  };

  this.PC_to_RDR_Secure = function (payload) {
    return [];
  };

  this.PC_to_RDR_Mechanical = function (payload) {
    return [];
  };

  this.PC_to_RDR_Abort = function (payload) {
    return [];
  };

  this.PC_to_RDR_SetDataRateAndClockFrequency = function (payload) {
    return [];
  }

}