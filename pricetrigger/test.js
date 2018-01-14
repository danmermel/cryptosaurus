var index = require('./index.js');

var event = {
  Records: [

   { 
     dynamodb: {
       Keys: {
         currency_name: {
           S: "ETH"
         }
       }
     }
   }
  ]
};
index.handler(event, {}, function(err, data)  {

  console.log('callback called');
   console.log(err, data);
  process.exit();
});
