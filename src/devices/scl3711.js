function SCL3711(usbDriver) {

  // TEMP
  this.vendorId = 0x04e6;
  this.productId = 0x5591
  ;

  var self = this;
  this.usb = usbDriver;
  this.ccid = CCID(usbDriver);

  this.command = function (adpu, cntx) {

    if (adpu.Type == 1) {

      var payload = command.make();

      var dcslen = payload.length;

      // header
      var header = new Uint8Array(8);  // header
      header[0] = 0x00;
      header[1] = 0x00;
      header[2] = 0xff;
      header[3] = 0xff;
      header[4] = 0xff;
      header[5] = dcslen >>> 8;
      header[6] = dcslen & 255;
      header[7] = 0x100 - ((header[5] + header[6]) & 255);  // length checksum

      var chksum = new Uint8Array(2);  // checksum: 2 bytes checksum at the end.
      chksum[0] = 0x100 - (dcs & 255);  // data checksum
      chksum[1] = 0x00;

      console.log(UTIL_fmt(">>> SCL3711 >>> 00 00 FF FF FF | DCSlen = XX XX | LenCheckSum = XX | " + UTIL_BytesToHex(payload) + " | CheckSum = XX XX"));
      self.ccid.PC_TO_RDR_Raw(UTIL_concat(UTIL_concat(header, payload), chksum),cntx);
    }


  }



}