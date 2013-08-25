var convict = require('convict');

// define a schema

var conf = convict({
  env: {
    doc: "The applicaton environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV"
  },
  mqtt: {
    host: {
      doc: "The MQTT broker.",
      format: String,
      default: "mosquitto.sunfish.io",
      env: "MQTT_HOST",
      arg: "mqtt-host"
    },
      port: {
      doc: "The MQTT port.",
      format: "port",
      default: 1883,
      env: "MQTT_PORT",
      arg:"mqtt-port"
    }
  },
  serial:{
    port:{
      doc:"The name of the serial port to bind to",
      format: String,
      default:"dynamic",
      env:"WC_SERIALPORT",
      arg:"serialport"
    },
    baud:{
      doc:"The speed of the serial port conncetion",
      format:"int",
      default:115200,
      env:"WC_SERIAL_BAUD",
      arg:"baud"
    }
  },
  device:{
    maker:{
      doc:"The manufacturer of the device",
      format:String,
      default:"Anonymous"
    },
    model:{
      doc:"The model of the device",
      format:String,
      default:"The Thing"
    },
    version:{
      doc:"The firmware version of the device",
      format:String,
      default:"0.0.0"
    },
    id:{
      doc:"The unique id of the device",
      format:String,
      default:""
    }
  }
  
});


// load environment dependent configuration

var env = conf.get('env');
conf.loadFile('./device.json');
conf.loadFile('./config/' + env + '.json');

// perform validation

conf.validate();

module.exports = conf;