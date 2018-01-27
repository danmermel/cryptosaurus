var request = require("request");
var async = require("async");
// Load the SDK for JavaScript
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();

// Load credentials and set the region from the JSON file
AWS.config.loadFromPath('./config.json');

// var kinesis = new AWS.Kinesis({ endpoint: "https://kinesis.eu-west-1.amazonaws.com"});

var reader = function (done) {
  console.log("Making http request");
  var req = {
    url:"https://min-api.cryptocompare.com/data/pricemulti?fsyms=BCH,BTG,ETH,ADA,NEO,QTUM,SC,RLC,SNT,SPHR,STRAT,XDN,XEM,XVG,ZCL,BTC,XMR,DASH,LTC,XRP,XLM,ETC,REP,ICN,MLN,ZEC,GNO,EOS&tsyms=BTC,USD",
    json: true 
  };
  request(req, function (err,r,data){
    console.log(err,data);
    done(err,data);
  })  
}

/*
var writeToQueue = function(data, callback) {
  var params = {
    Data: new Buffer(JSON.stringify(data)),
    PartitionKey: 'exchange',
    StreamName: 'exchange-kinesis'
  };
  kinesis.putRecord(params, callback);
};

*/

var writeToDB = function (data,  callback) {

  console.log('Trying connection');

  var event_date = new Date().toISOString();
  var event_source = "cryptocompare";
  var params ={
    RequestItems:{
      "exchange":[]
    }
  };
  var key = new Date().getTime();
  for(var i in data) {
    var obj = {
      PutRequest:{
        Item:{}
      }
    };
    obj.PutRequest.Item.id ={S: (key++).toString()}; 
    obj.PutRequest.Item.event_date ={S: event_date}; 
    obj.PutRequest.Item.currency_name ={S: i}; 
    obj.PutRequest.Item.price_btc ={N: data[i].BTC.toString()}; 
    obj.PutRequest.Item.price_usd ={N: data[i].USD.toString()}; 
    params.RequestItems.exchange.push(obj);
  }
  console.log(params);
  dynamodb.batchWriteItem(params, callback) ; 
}

exports.handler = function (event, context, callback) {
  // read from API and write to database
  console.log('exchange1 - starting up');
  reader(function(err, data) {
    if (err) {
      console.log('API could not be reached', err);
      return callback(err, null);
    }
    console.log('API says', data);
    var counter = 0;
    var obj = data ;

    async.doWhilst(
    // asynchronous action
    function(done) {

      var littleobj = {};
      var keys = Object.keys(obj).slice(counter, counter + 25);
      for(var i in keys) {
        littleobj[keys[i]] = obj[keys[i]];
      }
      console.log("Writing",Object.keys(littleobj));

      writeToDB(littleobj, function(err,data) {
        if (err) {
          console.log("ERROR!", err);
        } 
        counter += 25;
        console.log("done!");
        done(null,"success!");
      });
    },
    // decide whether to iterate again
    function() {
      console.log('checking', counter, Object.keys(obj).length);
      return counter < Object.keys(obj).length;
    },
    // it's all over
    function() {
      console.log('finished');
      callback(null,"success!");
    });

   });
};
