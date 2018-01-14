var btc = require('./btc.js');

console.log(btc.length);

var MACD = require('technicalindicators').MACD;

  var macdInput = {
    values: [],
    fastPeriod        : 12*5,
    slowPeriod        : 26*5,
    signalPeriod      : 3 ,
    SimpleMAOscillator: false,
    SimpleMASignal    : false
  };

btc = btc.map(function(v) { return parseFloat(v)});

var lastBuy = 0;
var dollars = 1000;
var bitcoin = 0;
var lastPurchasePrice = 0;

var numTransactions =0;

var lastAlert = 'sell';

var buyAlert = function(price, macdfirst, macdprevious, macdnow) {
//  console.log(price, macdprevious, macdnow);
//  if (lastAlert == 'sell' && macdnow > 0.2 && macdprevious < 0.2) {
  if (lastAlert == 'sell' && 
      macdprevious < macdnow &&
      macdprevious < macdfirst) {
    console.log('BUY', price);
    lastAlert = 'buy';
  }
}

var sellAlert = function(price, macdfirst, macdprevious, macdnow) {
//  if (lastAlert == 'buy' && macdnow < -0.2 && macdprevious > -0.2) {
  if (lastAlert == 'buy' && 
      macdprevious > macdnow &&
      macdprevious > macdfirst) {
    console.log('SELL', price);
    lastAlert = 'sell';
  }
}

var buy  = function(i, price, macd) {
  if (dollars >0) {
    bitcoin += (dollars/price) *0.998;
    console.log('BUY', i, price, macd, dollars, bitcoin);
    lastBuy = i;
    lastPurchasePrice = price;
    dollars = 0;
    numTransactions +=1;
  }
};

var sell  = function(i, price, macd) {
  // console.log ("possible sell", lastPurchasePrice, price);
  if (bitcoin >0 && (price < lastPurchasePrice *0.99 || price > lastPurchasePrice)) {
    dollars += price * bitcoin * 0.998;
    bitcoin = 0;
    console.log('SELL', i, price, macd, dollars, bitcoin);
    lastBuy =0;
    numTransactions +=1;
  }
};



const NUMVALS = 550;
for(var i = NUMVALS; i< btc.length; i++) {

  macdInput.values = btc.slice(i-NUMVALS, i);
  var macd = MACD.calculate(macdInput);
  var macdnow = macd[macd.length - 1];
  var macdprevious = macd[macd.length - 2];
  var macdfirst = macd[macd.length -3];
  var price = btc[i];
  buyAlert(price, macdfirst.histogram, macdprevious.histogram, macdnow.histogram);
  sellAlert(price, macdfirst.histogram, macdprevious.histogram, macdnow.histogram);
//console.log(i, macdInput.values.length, lastOne);
/*  if (lastOne.histogram > 0.1) {
    buy(i, btc[i], lastOne.histogram);
  } else if (lastOne.histogram < 0) {
    sell(i,btc[i], lastOne.histogram);

  }*/
}

console.log('FINAL SETTLEMENT', numTransactions, btc[0], btc[btc.length-2], dollars, bitcoin);
