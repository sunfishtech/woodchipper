var conf = require('../config.js');

var mqtt = require('mqtt')
  , client = mqtt.createClient(conf.get('mqtt.port'),conf.get('mqtt.host'));

var serialport = require("serialport")
var SerialPort = serialport.SerialPort
var sp = conf.get("serial.port");

var device = conf.get("device");

var sys = require('sys');
var exec = require('child_process').exec;

var ardre = /arduino/i;
var snapcmd = /snapshot/i;

if (sp && sp != "dynamic") {
  start()
} else {
  sp = null
  serialport.list(function (err, ports) {
    ports.forEach(function(port) {
      if (ardre.exec(port.pnpId) || ardre.exec(port.manufacturer)) {
        sp = port.comName;
      }
    });
    if (sp) {
      start()
    }
    else {
      console.log("No Arduino could be found");
    }
  });
}


function start() {
  var serialPort = new SerialPort(sp, {
      baudrate: conf.get("serial").baud,
      parser: serialport.parsers.readline("\n") 
  }, false); 

  serialPort.open(function () {
    console.log('open');
    serialPort.on('data', function(data) {
      onDeviceCommand(data);
    });  
  });

  var myTopics = topics();
  myTopics.forEach(function(topic){
    client.subscribe(topic)
    console.log("Subscribing to " + topic)
  });
  client.on('message', function(topic, message) {
    console.log(message);
    if (snapcmd.exec(message)){
      snapshot();
    } else {
      serialPort.write(message, function(err,results){
        //console.log('err ' + err);
        //console.log('results ' + results);
      });
    }
  });
}

function snapshot(){
  console.log("Say cheese!");
  exec("raspistill -t 0 -n -o /home/pi/test.jpg");
}

function onDeviceCommand(cmd) {
  console.log('Command received: ' + cmd);
  cmds = cmd.split("|")
  if (cmds[0] == "4" && cmds[1] == "0") {
    snapshot();
  }
  client.publish("device/" + device.id + "/publish",cmd);

}

function topics(){
  return [
    "*", //the broadcast topic
    device.maker,
    device.maker + "/" + device.model,
    device.maker + "/" + device.model + "/" + device.version,
    "device/" + device.id
  ]
}

