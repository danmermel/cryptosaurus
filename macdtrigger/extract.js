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
var technicalindicators = require('technicalindicators');

var readCurrencyPrice = function(currency, callback) {
  var q = {
    ExpressionAttributeValues: {
      ":v1": {
        S: currency
      }
    },
    ScanIndexForward: false, // descending order
    Limit:60*24,
    KeyConditionExpression: 'currency_name = :v1',
    TableName: 'exchange'
  };
  dynamodb.query(q, callback);
}

var main = function (event, context, callback) {
  // read from API and write to database
  console.log('price notifier - starting up');
  // gets the currency from the event that triggered the function
  var currency = 'BTC';
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
    for (var i =0; i<numbers.length; i++) {
     console.log(numbers[i]);
    }

  });

}; 

main();
