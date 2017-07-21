// Load the SDK for JavaScript
var AWS = require('aws-sdk');

// Load credentials and set the region from the JSON file
AWS.config.loadFromPath('./config.json');
var dynamodb = new AWS.DynamoDB();

var q = {
  ExpressionAttributeValues: {
    ":v1": {
      S: "BTC"
    }
  },
  ScanIndexForward: false, // descending order
  Limit:2,
  KeyConditionExpression: 'currency_name = :v1',
  TableName: 'exchange'
};


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
  dynamodb.query(q, callback);
};


exports.handler = function (event, context, callback) {
  // read from API and write to database
  console.log('notifier - starting up');

  readBTCPrice(function(err, data) {
    if (err) {
      throw(new Error("Could not read from database"));
    }
    var new_price = parseFloat(data.Items[0].price_usd.N);
    var old_price = parseFloat(data.Items[1].price_usd.N);

    console.log(new_price, old_price);
    if (new_price >= 2750 && old_price< 2750) {
      sendSMS('maths says BTC > 2750', callback);
    } else {
      console.log('not triggered');
      callback(null, data);
    }

  });

}; 
