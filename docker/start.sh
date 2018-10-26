#! /bin/bash
nginx
mongod --fork --logpath /opt/rcj-scoring-system/logs/mongod.log
cd /opt/rcj-scoring-system
sleep 10
node server.js
