#!/bin/bash
zip -r btctrigger.zip package.json index.js config.json
aws lambda update-function-code --function-name rsi_trig --zip-file fileb://btctrigger.zip

