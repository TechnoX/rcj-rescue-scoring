#! /bin/bash
nginx
mongod --fork --logpath /opt/rcj-scoring-system/logs/mongod.log
cd /opt/rcj-scoring-system
sleep 5
node server.js
