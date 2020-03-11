#!/bin/bash

#check_packages
rm -rf node_modules package-lock.json yarn.lock
yarn
# ES5 & ES6 version
rm -rf build
# Run build with increasing memory limit
# to fix the bug GC in old space requested
node --max-old-space-size=4096 ~/.npm/bin/polymer build

cd build/es6-bundled

# Make cache control for 7 days for all files on admin bucket
aws s3 --region ap-southeast-1 --profile hyperhaul sync . s3://geofencing-demo --delete --cache-control max-age=60,public