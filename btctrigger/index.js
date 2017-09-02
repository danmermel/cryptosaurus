// Load the SDK for JavaScript
var AWS = require('aws-sdk');

// Load credentials and set the region from the JSON file
AWS.config.loadFromPath('./config.json');
var dynamodb = new AWS.DynamoDB();

// Load the Analysis lib
var RSI = require('technicalindicators').RSI;


var sendSMS = function(message, callback) {
  var sns = new AWS.SNS();
  sns.publish({
    Message: message,
    TopicArn: process.env.ARN
  }, function(err, data) {
    if (err) {
      console.log(err.stack);
      return callback(err, null);;
    }
    console.log('push sent');
    console.log(data);
    callback(null, data);
  });
};

var readCurrencyPrice = function(currency, callback) {
  var q = {
    ExpressionAttributeValues: {
      ":v1": {
        S: currency
      }
    },
    ScanIndexForward: false, // descending order
    Limit:30,
    KeyConditionExpression: 'currency_name = :v1',
    TableName: 'exchange'
  };
  dynamodb.query(q, callback);
};

var writeToDB = function (currency_name, rsi_value,  callback) {

  console.log('Trying connection');

  var event_date = new Date().toISOString();
  var params ={
    RequestItems:{
      "rsi_analysis":[]
    }
  };
  var key = new Date().getTime();
  var obj = {
    PutRequest:{
      Item:{}
    }
  };
  obj.PutRequest.Item.id ={S: currency_name + (key++).toString()}; 
  obj.PutRequest.Item.event_date ={S: event_date}; 
  obj.PutRequest.Item.currency_name ={S: currency_name}; 
  obj.PutRequest.Item.rsi_value ={N: rsi_value.toString()}; 
  params.RequestItems.rsi_analysis.push(obj);
  
  console.log(params);
  dynamodb.batchWriteItem(params, callback) ; 
}

exports.handler = function (event, context, callback) {
  // read from API and write to database
  console.log('notifier - starting up');
  var currency = event.Records[0].dynamodb.Keys.currency_name.S;
  console.log("currency is" , currency);

  readCurrencyPrice(currency, function(err, data) {
    if (err) {
      throw(new Error("Could not read from database"));
    }
//    console.log('the data', JSON.stringify(data));
    var numbers =[];
    for (var i =0; i<data.Items.length; i++) {
      // console.log("an item is ", i, data.Items[i]);
      numbers.push(parseFloat(data.Items[i].price_usd.N));
    };
    numbers = numbers.reverse();

    // multiply the value by 1m because RSI algorithm doesn't like tiny numbers
    numbers = numbers.map(function(v) { return v* 1000000});
//    console.log('the nummbers', numbers);
    var inputRSI = {
      values : numbers,
      period : 29
    };
    var rsi = RSI.calculate(inputRSI);
    console.log(currency, rsi);
    if (!rsi[0]) {
        console.log("rsi was empty.. setting to 0");
        rsi[0]=0;
    }
    writeToDB(currency,rsi[0], function(err, data) {
      console.log("dynamodb  write", err, data);
      callback(null, { ok: true});
    });

  });

}; 
