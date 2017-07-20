var mysql = require ('mysql');

var writeToDB = function (data,  callback) {

  console.log('Trying connection');
  var config = require('./mysql.json');
  var connection = mysql.createConnection(config);
  connection.connect();
  console.log('Connection complete');

  var event_date = new Date().toISOString();
  var event_source = "cryptocompare";
  var sql ="";
  for(var i in data) {
    var currency_name = i;
    var price_btc = data[i].BTC;
    var price_usd = data[i].USD;
    sql += "INSERT INTO exchange (event_date, event_source, currency_name, price_btc, price_usd) VALUES ('"+event_date+"','"+event_source+"', '"+currency_name+"',"+ price_btc+","+ price_usd+");";
  }
  console.log(sql);
  connection.query(sql, function (error, results, fields) {
    if (error) {
      console.log('SQL ERROR', error);
      throw error;
    }
    // `results` is an array with one element for every statement in the query: 
    console.log(results);
    connection.end();
    callback(null, results);
  });


}

exports.handler = function (event, context, callback) {
   console.log("event", event, "context", context);
   var str = Buffer.from(event.Records[0].kinesis.data, 'base64').toString();
   var obj = JSON.parse(str);
   console.log('THE DATA', obj);
   writeToDB(obj, function(err,data) {
     console.log("done!");
     callback(null,"success!");
   });
}; 

