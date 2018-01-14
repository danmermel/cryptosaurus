var fs = require('fs');

var data = fs.readFileSync('./btc_co.tsv', {encoding: 'utf8'});
var lines = data.split('\n');
var crypto_balance = 1.0;
var dollar_balance = 0;
var last_action = 'buy';
for(var i in lines) {
  var line = lines[i].trim().split('\t');
  var obj = {
    event_date: line[0], 
    usd_price: parseFloat(line[1]),
    rsi: parseInt(line[2])
  };
  

  // SELL DOLLARS FOR CRYPTO  
  if (obj.rsi > 70 && last_action == 'sell') {
    crypto_balance += dollar_balance / obj.usd_price;
    dollar_balance = 0;
    last_action = 'buy';
    console.log('BUY!', obj.rsi, obj.usd_price, crypto_balance, dollar_balance);
  } 

  // SELL CRYPTO FOR DOLLARS
  if ( obj.rsi < 20 && last_action == 'buy') {
    dollar_balance += obj.usd_price *  crypto_balance;
    crypto_balance = 0;
    last_action = 'sell';
    console.log('SELL!', obj.rsi, obj.usd_price, crypto_balance, dollar_balance);
  }
}

console.log('DONE!', crypto_balance, dollar_balance);


