var request = require("request");
// Load the SDK for JavaScript
var AWS = require('aws-sdk');

// Load credentials and set the region from the JSON file
AWS.config.loadFromPath('./config.json');

//var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
var kinesis = new AWS.Kinesis({ endpoint: "https://kinesis.eu-west-1.amazonaws.com"});

var reader = function (done) {
  console.log("Making http request");
  var req = {
    url:"https://min-api.cryptocompare.com/data/pricemulti?fsyms=ETH,BTC,XMR,DASH,LTC,XRP,XLM,ETC,REP,ICN,MLN,ZEC,DOGE,USDT,GNO,EOS&tsyms=BTC,USD",
    json: true 
  };
  request(req, function (err,r,data){
    console.log(err,data);
    done(err,data);
  })  
}

var writeToQueue = function(data, callback) {
  var params = {
    Data: new Buffer(JSON.stringify(data)),
    PartitionKey: 'exchange',
    StreamName: 'exchange-kinesis'
  };
  kinesis.putRecord(params, callback);
};

exports.handler = function (event, context, callback) {
  // read from API and write to database
  console.log('exchange1 - starting up');
  reader(function(err, data) {
    if (err) {
      console.log('API could not be reached', err);
      return callback(err, null);
    }
    console.log('API says', data);
    writeToQueue(data, function(err, messageid) {
      console.log('Queue says', err, messageid);
      callback(err, messageid);
    });
  });
}; 
