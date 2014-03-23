var ADPU = {
}

ADPU.InListPassiveTarget = function () {
    this.MaxTg = 0x01;
    this.BrTy = 0x00;
    this.InitiatorData = null;

    this.make = function () {
        return new Uint8Array([0xD4,0x4A, this.MaxTg, this.BrTy]);
    }

    this.response = function(frame) {

    }

    this.debug = function () {
        function BrTyOut(val) {
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
        console.log(UTIL_fmt(">>> ADPU >>> InListPassiveTarget.1 | D4 4A | MaxTg = " + this.MaxTg + " | BrTy = " + BrTyOut(this.BrTy)));
        console.log(UTIL_fmt(">>> ADPU >>> InListPassiveTarget.2 | InitiatorData:" + UTIL_BytesToHexWithSeparator(this.InitiatorData)));
    }
}


