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
  Limit:200,
  KeyConditionExpression: 'currency_name = :v1',
  TableName: 'exchange'
};


var readBTCPrice = function(callback) {
  dynamodb.query(q, callback);
};

readBTCPrice(function(err, data) {
  if (err) {
    throw(new Error("Could not read from database"));
  }
  for(var i=0; i< data.Items.length; i++) {

    var p = parseFloat(data.Items[i].price_usd.N);
    var t = data.Items[i].event_date.S;
    console.log(t + "\t" + p);
  }
}); 
