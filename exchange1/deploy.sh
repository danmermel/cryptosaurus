#!/bin/bash
zip -r exchange1.zip package.json index.js config.json node_modules/
aws lambda update-function-code --function-name exchange1 --zip-file fileb://exchange1.zip


