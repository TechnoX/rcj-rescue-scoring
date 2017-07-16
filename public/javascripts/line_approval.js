// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule']);
var marker={};
var socket;
// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', function($scope, $uibModal, $log, $timeout, $http){
    $scope.sliderOptions = {
        floor: 0,
        ceil: 0,
        showSelectionBar: true,
        showTicksValues: true
    };

    $scope.visType = "slider";
    $scope.z = 0;
    $scope.tiles = {};
    if(typeof runId !== 'undefined'){
        loadNewRun();
    }

    (function launchSocketIo() {
        // launch socket.io
        socket = io(window.location.origin,{ transports: [ 'websocket' ] });
        if(typeof runId !== 'undefined'){
            $scope.actualUsedDropTiles = 0; 
            socket.emit('subscribe', 'runs/' + runId);
            socket.on('data', function(data) {
                console.log(data);
                for(var i = 0; i < data.tiles.length; i++){
                    $scope.tiles[data.tiles[i].x + ',' +
                                 data.tiles[i].y + ',' +
                                 data.tiles[i].z].scoredItems = data.tiles[i].scoredItems;
                }
                $scope.tiles[data.startTile.x + ',' +
                         data.startTile.y + ',' +
                         data.startTile.z].start = data.showedUp;
                $scope.rescuedLiveVictims = data.rescuedLiveVictims;
                $scope.rescuedDeadVictims = data.rescuedDeadVictims;
                $scope.rescueLevel = data.rescueLevel;
                $scope.escapeEvacuationZone = data.escapeEvacuationZone;
                $scope.score = data.score;
                $scope.showedUp = data.showedUp;
                $scope.LoPs = data.LoPs;
                $scope.minutes = data.time.minutes;
                $scope.seconds = data.time.seconds;
                $scope.retired = data.retired;
                $scope.$apply();
                console.log("Updated view from socket.io");
            });
        }

        if(typeof fieldId !== 'undefined'){
            socket.emit('subscribe', 'fields/' + fieldId);
            socket.on('data', function(data) {
//                if(typeof runId === 'undefined') || runId != data.newRun){ // TODO: FIX!
                    console.log("Judge changed to a new run");
                    runId = data.newRun;
                    loadNewRun();
//                }
            });


        }

    })();




    function loadNewRun(){
        $http.get("/api/runs/"+runId+"?populate=true").then(function(response){
            $scope.height = response.data.height;
            $scope.sliderOptions.ceil = $scope.height - 1;
            $scope.width = response.data.width;
            $scope.length = response.data.length;
            width = response.data.width;
            length = response.data.length;
            $scope.team = response.data.team;
            $scope.field = response.data.field;
            $scope.competition = response.data.competition;
            $scope.round = response.data.round;
            $scope.retired = response.data.retired;
            $scope.numberOfDropTiles = response.data.numberOfDropTiles;;
            $scope.rescuedLiveVictims = response.data.rescuedLiveVictims;
            $scope.rescuedDeadVictims = response.data.rescuedDeadVictims;
            $scope.escapeEvacuationZone = response.data.escapeEvacuationZone;
            $scope.rescueLevel = response.data.rescueLevel;

            for(var i = 0; i < response.data.tiles.length; i++){
                $scope.tiles[response.data.tiles[i].x + ',' +
                             response.data.tiles[i].y + ',' +
                             response.data.tiles[i].z] = response.data.tiles[i];
                if(response.data.tiles[i].scoredItems.dropTiles.length>0){
                $scope.placedDropTiles++;
		        $scope.actualUsedDropTiles += response.data.tiles[i].scoredItems.dropTiles.length;
                    for(var j = 0; j < response.data.tiles[i].index.length ; j++){
                    marker[response.data.tiles[i].index[j]] = true;
                    } 
	           }
            }
            $scope.tiles[response.data.startTile.x + ',' +
                         response.data.startTile.y + ',' +
                         response.data.startTile.z].start = response.data.showedUp;
            $scope.score = response.data.score;
            $scope.showedUp = response.data.showedUp;
            $scope.LoPs = response.data.LoPs;
            // Verified time by timekeeper
            $scope.minutes = response.data.time.minutes;
            $scope.seconds = response.data.time.seconds;
            $scope.cap_sig = response.data.sign.captain;
            $scope.ref_sig = response.data.sign.referee;
            $scope.refas_sig = response.data.sign.referee_as;

            console.log($scope.tiles);
        }, function(response){
            console.log("Error: " + response.statusText);
        });
    }


    $scope.range = function(n){
        arr = [];
        for (var i=0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }

    $scope.getOpacity = function(x,y){
        var stackedTiles = 0;
        for(var z = 0; z < $scope.height; z++){
            if($scope.tiles[x+','+y+','+z])
                stackedTiles++;
        }
        return 1.0/stackedTiles;
    }
    
    $scope.go = function(path){
      socket.emit('unsubscribe', 'runs/' + runId);
      window.location = path
  }
    
     $scope.totalNumberOf = function(objects){
        return objects.gaps + objects.speedbumps + objects.obstacles + objects.intersections;
    }
    
    $scope.showElements = function(x,y,z){
        var tile = $scope.tiles[x+','+y+','+z];
        // If this is not a created tile
        if(!tile)
            return;


        var total = $scope.totalNumberOf(tile.items);

        // If the run is not started, we can place drop pucks on this tile
        
            // Add the number of possible passes for drop tiles
            if(tile.scoredItems.dropTiles.length > 0) {
                total += tile.scoredItems.dropTiles.length;
            }
            if(tile.start != null)total ++;

            if(total == 0){
                return;
            }else if(total > 1){
                $scope.open(x,y,z);
                // Save data from modal when closing it
            }else{
                return;
            }
    }


    $scope.open = function(x,y,z) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: '/templates/line_view_modal.html',
            controller: 'ModalInstanceCtrl',
            size: 'sm',
            resolve: {
                tile: function () {
                    return $scope.tiles[x+','+y+','+z];
                }
            }
        }).closed.then(function(result){
            console.log("Closed modal");
        });
    };
    
    $scope.success_message = function(){
        swal({
                    title: 'Recorded!', 
                    text: 'Recording to public server succeeded', 
                    type: 'success'
                },function(){
                    $scope.go("/admin/"+$scope.competition._id+"/runs/");
                });
                console.log("Success!!");
    }
    
    $scope.send_public = function(){
        swal({
          title: "Approval?", 
          text: "Click 'Yes' to send the run data to the public server.", 
          type: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, approval it!",
          confirmButtonColor: "#ec6c62"
        }, function() {
            var run = {}
            run.height = $scope.height;
            run.width = $scope.width;
            run.length = $scope.length;
            run.rescuedVictims = $scope.rescuedVictims;
            run.tiles = $scope.tiles;
            run.showedUp = $scope.showedUp;
            run.LoPs = $scope.LoPs;
            run.time = {};
            run.time.minutes = $scope.minutes;
            run.time.seconds = $scope.seconds;
            run.retired = $scope.retired;
            run.status = 5;
            $http.post("https://example.com/"+runId+"/update/token", run).then(function(response){
                var run = {}
                run.status = 5;
                $http.post("/api/runs/"+runId+"/update", run).then(function(response){
                    setTimeout($scope.success_message,500);
                }, function(response){
                    swal("Oops", "It could not be sent normally. Please call the system manager.", "error");
                    console.log("Error: " + response.statusText);
                });
                

            }, function(response){
                swal("Oops", "It could not be sent normally. Please call the system manager.", "error");
                console.log("Error: " + response.statusText);
            });
            
        });
        
        
    }



}]).directive("tileLoadFinished", function($timeout){
    return function(scope, element, attrs){
      if (scope.$last){
           $timeout(function(){
            tile_size();
          },0);
          $timeout(function(){
            tile_size();
          },500);
          $timeout(function(){
            tile_size();
          },1000);
      }
    }
});


app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, tile) {
    $scope.tile = tile;
    $scope.ok = function () {
        $uibModalInstance.close();
    };
});

app.directive('tile', function() {
    return {
        scope: {
            tile: '='
        },
        restrict: 'E',
        templateUrl: '/templates/tile.html',
        link : function($scope, element, attrs){
            
            $scope.checkpointNumber = function(tile){
                var ret_txt="";
                if(!tile)return;
                for(var i = 0; i < tile.index.length ; i++){
                    if(marker[tile.index[i]]){
                        var count = 0;
                        for(var j = 0; j < tile.index[i]; j++){
                            if(marker[j])count++;
                        }
                        count++;
                        if(i!=0)ret_txt += '&'
                        ret_txt += count;
                    }
                    else{
                        return;
                    }
                }
                return ret_txt;
            }
            
            $scope.tileStatus = function(tile){
                // If this is a non-existent tile
                if(!tile)
                    return;
                var successfully = 0;
                var possible = 0;

                var count = function(list){
                    for(var i = 0; i < list.length; i++){
                        if(list[i])
                            successfully++;
                        possible++;
                    }
                }
                count(tile.scoredItems.gaps);
                count(tile.scoredItems.speedbumps);
                count(tile.scoredItems.intersections);
                count(tile.scoredItems.obstacles);
                if(tile.scoredItems.dropTiles.length > 0)
                    count(tile.scoredItems.dropTiles);

                if((possible > 0 && successfully == possible) || tile.start)
                    return "done";
                else if(successfully > 0)
                    return "halfdone";
                else if(possible > 0 || (tile.start != null && !tile.start))
                    return "undone";
                else
                    return "";
            }

            $scope.rotateRamp = function(direction){
                switch(direction){
                case "bottom":
                    return "rot0";
                case "top":
                    return "rot180";
                case "left":
                    return "rot90";
                case "right":
                    return "rot270";
                }
            }
        }
    };
});

function tile_size(){
        $(function() {
            try{
                var b = $('.tilearea');
                console.log('コンテンツ本体：' + b.height() + '×' + b.width());
                console.log('window：' + window.innerHeight);
                var tilesize_w = ($('.tilearea').width()-50) / width;
                var tilesize_h = (window.innerHeight*0.7) / length;
                console.log('tilesize_w:' + tilesize_w);
                console.log('tilesize_h:' + tilesize_h);
                if(tilesize_h > tilesize_w)var tilesize = tilesize_w;
                else var tilesize = tilesize_h;
                $('tile').css('height',tilesize); 
                $('tile').css('width',tilesize);
                $('.tile-image').css('height',tilesize); 
                $('.tile-image').css('width',tilesize); 
                $('.slot').css('height',tilesize); 
                $('.slot').css('width',tilesize); 
                $('#card_area').css('height',(window.innerHeight - 150));
                $('.chnumtxt').css('font-size',tilesize/6); 
                if(b.height() == 0)setTimeout("tile_size()", 500);
            }
            
            catch(e){
                setTimeout("tile_size()", 500);
            }
          

    });
}


var currentWidth = -1;

$(window).on('load resize', function(){
    if (currentWidth == window.innerWidth) {
        return;
    }
    currentWidth = window.innerWidth;
    var height = $('.navbar').height();
    $('body').css('padding-top',height+40); 
    tile_size();
    
    });
$(window).on('beforeunload', function(){
     socket.emit('unsubscribe', 'runs/' + runId);
    });


let lastTouch = 0;
document.addEventListener('touchend', event => {
  const now = window.performance.now();
  if (now - lastTouch <= 500) {
    event.preventDefault();
  }
  lastTouch = now;
}, true);
