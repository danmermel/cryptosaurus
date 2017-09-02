/* 
what this does is:
gets triggered every time there is a new row added to the pricess db.
figures out what currency was added
decides whether the price of that currency is greater than the price of it an hour ago by a factor of x
if it is AND it has not done so within the last y time (say an hour), then it sends out an SMS alert
it stores the last time it sent an alert  in the alerts_log table
Otherwise (price change not enough, or alert too recent) it does nothing.
*/

// Load the SDK for JavaScript
var AWS = require('aws-sdk');

// Load credentials and set the region from the JSON file
AWS.config.loadFromPath('./config.json');
var dynamodb = new AWS.DynamoDB();

var sendSMS = function(message, callback) {
  var sns = new AWS.SNS();
  sns.publish({
    Message: message,
    TopicArn: process.env.ARN   //gets the topic from an env variable 
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
    Limit:60,
    KeyConditionExpression: 'currency_name = :v1',
    TableName: 'exchange'
  };
  dynamodb.query(q, callback);
};

var readAlertsLog = function(currency, callback) {
  var q = {
    ExpressionAttributeValues: {
      ":v1": {
        S: currency
      }
    },
    ScanIndexForward: false, // descending order, so gets the latest
    Limit:1,
    KeyConditionExpression: 'currency_name = :v1',
    TableName: 'alerts_log'
  };
  dynamodb.query(q, callback);
};

var writeToDB = function (currency_name,  callback) {
  console.log('Trying connection');
  var event_date = new Date().toISOString();
  var params ={
    RequestItems:{
      "alerts_log":[]
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
  params.RequestItems.alerts_log.push(obj);
  
  console.log(params);
  dynamodb.batchWriteItem(params, callback) ; 
}

exports.handler = function (event, context, callback) {
  // read from API and write to database
  console.log('price notifier - starting up');
  // gets the currency from the event that triggered the function
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


   // compare newest element of array with  oldest 
    console.log(numbers[59], numbers[0])
    if (numbers[59] > numbers[0]*1.1) {
      readAlertsLog(currency, function (err,data) {
        if (err) {
          throw(new Error("Could not read from database"));
        };
        var alert = false;
        if (data.Items.length > 0) {
          var last_alert_date = new Date(data.Items[0].event_date.S).getTime();  //in miliseconds
          var current_date = new Date().getTime();  //in ms
          if (current_date > last_alert_date+(1000*60*5)) {     //last alert sent more than 10 mins ago
            alert = true;
          }
        }
        if (data.Items.length == 0 || alert == true) {
          console.log("ALERT!");
          sendSMS("Price shift " + currency + " from " +  numbers[0] + " to " + numbers[59], function(err, data) {
            writeToDB(currency, callback); 
          });
        } else {
          console.log("No alert because too soon since last one!");
          callback(null, {ok:true});
        }
      });
    } else {
      console.log("No price shift");
      callback(null, {ok:true});
    }

  });

}; 
