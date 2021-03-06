/* Copyright (c) 2013 Gordon Williams, Pur3 Ltd. See the file LICENSE for copying permission. */
/*
Module for the DS18B20 temperature sensor

```
var ow = new OneWire(A1);
var sensor = require("DS18B20").connect(ow);
console.log(sensor.getTemp());
sensor.setRes(9);
console.log(sensor.getTemp());
var sensor2 = require("DS18B20").connect(ow, 1);
var sensor3 = require("DS18B20").connect(ow, -8358680895374756824);
```
*/

var C = {
  CONVERT_T: 0x44,
  COPY: 0x48,
  READ: 0xBE,
  WRITE: 0x4E
};

function DS18B20(oneWire, device) {
  this.bus = oneWire;
  if (device === undefined) {
    this.sCode = this.bus.search()[0];
  } else {
    if (device >= 0 && device <= 126) {
      this.sCode = this.bus.search()[device];
    } else {
      this.sCode = device;
    }
  }
}

DS18B20.prototype._readSpad = function (convert_t) {
  var spad = [];
  this.bus.reset();
  this.bus.select(this.sCode);
  if (convert_t) {
    this.bus.write(C.CONVERT_T, true);
    this.bus.reset();
    this.bus.select(this.sCode);
  }
  this.bus.write(C.READ);
  for (var i = 0; i < 9; i++) {
    spad.push(this.bus.read());
  }
  return spad;
};

DS18B20.prototype._writeSpad = function (th, tl, conf) {
  this.bus.reset();
  this.bus.select(this.sCode);
  this.bus.write(C.WRITE);
  for (var i = 0; i < 3; i++) {
    this.bus.write(arguments[i]);
  }
  this.bus.reset();
  this.bus.select(this.sCode);
  this.bus.write(C.COPY);
  this.bus.reset();
};

DS18B20.prototype.setRes = function (res) {
  var spad = this._readSpad();
  res = [0x1F, 0x3F, 0x5F, 0x7F][E.clip(res, 9, 12) - 9];
  this._writeSpad(spad[2], spad[3], res);
};

DS18B20.prototype.getRes = function () {
  return [0x1F, 0x3F, 0x5F, 0x7F].indexOf(this._readSpad()[4]) + 9;
};

DS18B20.prototype.isPresent = function () {
  return this.bus.search().indexOf(this.sCode) !== -1;
};

DS18B20.prototype.getTemp = function (verify) {
  var spad = null;
  var temp = null;
  if ((verify && !this.isPresent()) || !this.sCode) {
    return temp;
  }
  spad = this._readSpad(true);
  temp = spad[0] + (spad[1] << 8);
  if (temp > 32767) {
    temp -= 65536;
  }
  temp = temp / 16.0;
  return temp;
};

exports.connect = function (oneWire, device) {return new DS18B20(oneWire, device);};
