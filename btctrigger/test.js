var index = require('./index.js');

index.handler({}, {}, function(err, data)  {

  console.log('callback called');
   console.log(err, data);
  process.exit();
});
