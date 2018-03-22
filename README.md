# rcj-rescue-scoring
RoboCup Junior Rescue Scoring System

System used in the national competitions in Sweden in RoboCup Junior.
Also used at the international RoboCup 2017 in Nagoya.

This was first developed in php, by later replaced with a node.js backend and angular.js frontend. 

# How to use the application

The scoring system is web based and needs to run on a server.
The only software that needs to be installed on this server is
1. MongoDB
2. NodeJS
3. npm
4. bower

After installing these applications, download or clone this repository. In the repository directory, execute
```
npm install
bower install
node server.js
```
After that, the server should run on your local machine, accessible at `localhost:3000`. You can log in as an administrator with the user/password combination
```
admin
adminpass
```
or as a judge with
```
judge
judgepass
```