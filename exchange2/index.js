var AWS = require ('aws-sdk');
AWS.config.loadFromPath('./config.json');
var dynamodb = new AWS.DynamoDB();

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
   console.log("event", event, "context", context);
   var str = Buffer.from(event.Records[0].kinesis.data, 'base64').toString();
   var obj = JSON.parse(str);
   console.log('THE DATA', obj);
   writeToDB(obj, function(err,data) {
     if (err) {
       console.log("ERROR!", err);
     } 
     console.log("done!");
     callback(null,"success!");
   });
}; 

