# RoboCup Junior
### Rescue Scoring System

The RCJ Scoring System was designed for help the referees of RoboCup Junior Rescue Line / Maze. In this system, it is very easy to do everything related to competition management, from course map creation to score calculation and ranking. 

## Working Demo
[https://rcj.cloud](https://rcj.cloud)

## Usage
### Use Docker Image
There is no international version. ;(  
But you can use Japanese localized version from below link.  There is a small difference from international version in league setting.  
[https://hub.docker.com/r/ryorobo/rcj-rescue-scoring-japan](https://hub.docker.com/r/ryorobo/rcj-rescue-scoring-japan)  

Also you can use helper files to make up the environment!  
[https://github.com/rrrobo/rcj-scoring-docker](https://github.com/rrrobo/rcj-scoring-docker)


### Setup without using Docker
#### Required software
* [Node.js](https://nodejs.org/en/)
* [mongodb](https://www.mongodb.com)
Please install these 2 softwares.

### Install the Bower
`sudo npm install -g bower`

### Setup Dependency
`npm install`
`bower install`
`npm run build`

### Make the directory for logs
`mkdir logs`

### Startup
`node server`

## Default Account 

User        | Password         |
----------------|-------------------|
admin | adminpass   |


## Screenshots
Home(2019)
<img src="https://raw.githubusercontent.com/rrrobo/rcj-rescue-scoring-japan/master/rcjj-scoring/1.png">
<hr>
Login
<img src="https://raw.githubusercontent.com/rrrobo/rcj-rescue-scoring-japan/master/rcjj-scoring/6.png">
<hr>
Line
<img src="https://raw.githubusercontent.com/rrrobo/rcj-rescue-scoring-japan/master/rcjj-scoring/2.png">
<hr>
Line
<img src="https://raw.githubusercontent.com/rrrobo/rcj-rescue-scoring-japan/master/rcjj-scoring/3.png">
<hr>
Line  
<img src="https://raw.githubusercontent.com/rrrobo/rcj-rescue-scoring-japan/master/rcjj-scoring/4.png">
<hr>
Line  
<img src="https://raw.githubusercontent.com/rrrobo/rcj-rescue-scoring-japan/master/rcjj-scoring/5.png">
<hr>
Maze 
<img src="https://raw.githubusercontent.com/rrrobo/rcj-rescue-scoring-japan/master/rcjj-scoring/7.png">
<hr>

### Sound effects

Thanks!

* [MusMus](http://musmus.main.jp)
* [魔王魂](https://maoudamashii.jokersounds.com)
