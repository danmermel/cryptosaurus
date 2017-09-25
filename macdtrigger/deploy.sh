#!/bin/bash
zip -r macdtrigger.zip package.json index.js config.json node_modules
aws lambda update-function-code --function-name macd_trigger --zip-file fileb://macdtrigger.zip

