function ACR122(dev) {
  var self = this;
  this.usb = dev;
  this.ccid = new CCID(dev);

  this.command = function (adpu, callback) {

    if (adpu.Type == 1) {

      payload = adpu.make();

      var pseudo = new Uint8Array(5);              // Pseudo-APDU
      pseudo[0] = 0xFF;                            //   Class
      pseudo[1] = 0x00;                            //   INS (fixed 0)
      pseudo[2] = 0x00;                            //   P1 (fixed 0)
      pseudo[3] = 0x00;                            //   P2 (fixed 0)
      pseudo[4] = payload.length;                   //   Lc (Number of Bytes to send)

      console.log(UTIL_fmt(">>> ACR122 >>> Pseudo ADPU | Class = FF | INS = 00 | P1 = 00 | P2 = 00 | Lc = " + payload.length + " | " + UTIL_BytesToHex(payload)));
      self.ccid.PC_TO_RDR_Escape(UTIL_concat(pseudo, payload), callback);
    }


  }


}
