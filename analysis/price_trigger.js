var fs = require('fs');

var data = fs.readFileSync('./xmr_prices.txt', {encoding: 'utf8'});
var lines = data.split('\n');
var last_trig = 0;
for(var i in lines) {
  var line = lines[i].trim().split('\t');
  var obj = {
    event_date: line[1], 
    usd_price: parseFloat(line[2])
    // rsi: parseInt(line[2])
  };

  if (i> 60) {  //we have enough data
    var prev_price = parseFloat(lines[i-60].trim().split('\t')[2]);  //get the value an hour ago
    // console.log(obj.usd_price, prev_price, prev_price*1.1);
    if (obj.usd_price > prev_price *1.01) {
      var ts = new Date(obj.event_date).getTime();
      if (ts - last_trig > (1000*60*10)) {   //last alert sent more than 10m ago
        console.log("ALERT!!", obj.event_date, obj.usd_price, prev_price);
        last_trig = ts;
      }
    }
  }  
}

console.log('DONE!');


