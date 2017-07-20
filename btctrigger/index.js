// Load the SDK for JavaScript
var AWS = require('aws-sdk');

// Load credentials and set the region from the JSON file
AWS.config.loadFromPath('./config.json');

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

var readBTCPrice = function(callback) {
  var mysql = require ('mysql');
  var config = require('./mysql.json');
  var connection = mysql.createConnection(config);
  connection.connect();

  var sql = "SELECT * FROM exchange WHERE currency_name='BTC' ORDER BY event_date DESC LIMIT 2";
  
  connection.query(sql, function (error, results, fields) {
    console.log(error, results, fields);
    connection.end();
    callback(error, results);
  });
};


exports.handler = function (event, context, callback) {
  // read from API and write to database
  console.log('notifier - starting up');

  readBTCPrice(function(err, data) {
    if (err) {
      throw(new Error("Could not read from database"));
    }
    console.log(data[0].price_usd, data[1].price_usd);
    if (data[0].price_usd >= 2385 && data[1].price_usd< 2385) {
      sendSMS('maths says BTC > 2385', callback);
    } else {
      console.log('not triggered');
      callback(null, data);
    }

  });

}; 
