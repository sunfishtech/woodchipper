var conf = require('../config.js');
var device = conf.get("device");

var mqtt = require('mqtt')
  , client = mqtt.createClient(
    conf.get('mqtt.port'),
    conf.get('mqtt.host'),
    {
      clientId: device.id,
      will: {
        topic:'device/' + device.id + '/goodbye',
        payload:"0|" + device.id,
        qos:1
      }
    }
  );

var serialport = require("serialport")
var SerialPort = serialport.SerialPort
var sp = conf.get("serial.port");


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
    serialPort.on('data', function(data) {
      onDeviceCommand(data);
    });  
  });

  var myTopics = topics();
  myTopics.forEach(function(topic){
    client.subscribe(topic,{qos:1})
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
  hereiam();
}

function onDeviceCommand(cmd) {
  reading(cmd);
}

function hereiam(){
  cmd = [0,device.maker,device.model,device.version,device.id].join("|");
  publish("hereiam", cmd, {qos:1, retained:true});
}

function reading(cmd) {
  publish("reading", cmd,{qos:1, retained:true});
}

function publish(messageType, cmd, opts){
  var topic = "device/" + device.id + "/" + messageType;
  client.publish(topic,cmd,opts);
}

function topics(){
  return [
    "*", //the broadcast topic
    device.maker,
    device.maker + "/" + device.model,
    device.maker + "/" + device.model + "/" + device.version,
    "device/" + device.id + "/command"
  ]
}

