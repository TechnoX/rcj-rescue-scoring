// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule']);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log','$http', function($scope, $uibModal, $log, $http){
    $scope.sliderOptions = {
        floor: 0,
        ceil: 0,
        vertical: true,
        showSelectionBar: true,
        showTicksValues: true,
        ticksValuesTooltip: function (v) {
            return 'Level ' + v;
        }
    };
    $scope.z = 0;
    $scope.startTile = {x: 0, y: 0, z: 0};
    $scope.height = 1;
    $scope.sliderOptions.ceil = $scope.height - 1;
    $scope.width = 1;
    $scope.length = 1;
    $scope.name = "Awesome Testbana";
    $scope.cells = {};



    if(mapId){
        $http.get("/api/maps/maze/" + mapId + "?populate=true").then(function(response){
	    console.log(response.data);
            $scope.startTile = response.data.startTile;
            $scope.height = response.data.height;
            $scope.sliderOptions.ceil = $scope.height - 1;
            $scope.width = response.data.width;
            $scope.length = response.data.length;
            $scope.name = response.data.name;
	    competitionId = response.data.competition;
	    
	    for(var i = 0; i < response.data.cells.length; i++){
                $scope.cells[response.data.cells[i].x + ',' +
                             response.data.cells[i].y + ',' +
                             response.data.cells[i].z] = response.data.cells[i];
            }

	    
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

    $scope.$watchCollection('startTile', function(newValue, oldValue){
	// If initialization
	if(newValue === oldValue)
	    return;
	if($scope.cells[oldValue.x+','+oldValue.y+','+oldValue.z])
	    $scope.cells[oldValue.x+','+oldValue.y+','+oldValue.z].checkpoint = false;
	$scope.cells[newValue.x+','+newValue.y+','+newValue.z].checkpoint = true;
	$scope.recalculateLinear();
    });

    $scope.isUndefined = function (thing) {
	return (typeof thing === "undefined");
    }
    $scope.recalculateLinear = function(){
	if($scope.startNotSet())
	    return;

	// Reset all previous linear walls
	for(var index in $scope.cells){
	    $scope.cells[index].isLinear = false;
	}

	// Start it will all 4 walls around the starting tile
	recurs($scope.startTile.x-1, $scope.startTile.y, $scope.startTile.z);
	recurs($scope.startTile.x+1, $scope.startTile.y, $scope.startTile.z);
	recurs($scope.startTile.x, $scope.startTile.y-1, $scope.startTile.z);
	recurs($scope.startTile.x, $scope.startTile.y+1, $scope.startTile.z);
    }
    function isOdd(num) { return num % 2;}
    function recurs(x,y,z){
	if(x < 0 || y < 0 || z < 0){
	    return;
	}
	
	var cell = $scope.cells[x+','+y+','+z];
	
	// If this is a wall that doesn't exists
	if(!cell)
	    return;

	// Outside of the current maze size. 
	if(x > $scope.width*2 + 1 || x < 0 ||
	   y > $scope.length*2 + 1 || y < 0 ||
	   z > $scope.height || z < 0)
	    return;

	// Already visited this, returning
	if(cell.isLinear)
	    return;
	if(cell.isWall){
	    cell.isLinear = true;

	    
	    // horizontal walls
	    if(isOdd(x) && !isOdd(y)){
		// Set tiles around this wall to linear
		setTileLinear(x-2,y-1,z);
		setTileLinear(x,y-1,z);
		setTileLinear(x+2,y-1,z);
		setTileLinear(x-2,y+1,z);
		setTileLinear(x,y+1,z);
		setTileLinear(x+2,y+1,z);
		// Check neighbours
		recurs(x+2,y,z);
		recurs(x-2,y,z);
		recurs(x-1,y-1,z);
		recurs(x-1,y+1,z);
		recurs(x+1,y-1,z);
		recurs(x+1,y+1,z);
	    }// Vertical wall
	    else if(!isOdd(x) && isOdd(y)){
		// Set tiles around this wall to linear
		setTileLinear(x-1,y-2,z);
		setTileLinear(x-1,y,z);
		setTileLinear(x-1,y+2,z);
		setTileLinear(x+1,y-2,z);
		setTileLinear(x+1,y,z);
		setTileLinear(x+1,y+2,z);
		// Check neighbours
		recurs(x,y-2,z);
		recurs(x,y+2,z);
		recurs(x-1,y-1,z);
		recurs(x-1,y+1,z);
		recurs(x+1,y-1,z);
		recurs(x+1,y+1,z);
	    }
	}
    }
    function setTileLinear(x,y,z){
	// Check that this is an actual tile, not a wall
	var cell = $scope.cells[x+','+y+','+z];
	if(cell){
	    cell.isLinear = true;
	}else{
	    $scope.cells[x+','+y+','+z] = {isTile: true, isLinear: true, changeFloorTo: z};
	}
    }

    $scope.startNotSet = function(){
	return $scope.startTile.x == 0 && $scope.startTile.y == 0 && $scope.startTile.z == 0;
    }



    
    $scope.saveMap = function(){
        var map = {
	    competition: competitionId,
            name: $scope.name,
            length: $scope.length,
            height: $scope.height,
            width: $scope.width,
	    finished: $scope.finished,
            startTile: $scope.startTile,
	    cells: $scope.cells
        };
	console.log(map);
        $http.post("/api/maps/maze", map).then(function(response){
            alert("Success!");
            console.log(response.data);
            window.location.replace("/maze/editor/" + response.data.id)
        }, function(response){
            console.log(response);
            console.log("Error: " + response.statusText);
        });
    }

    $scope.cellClick = function(x,y,z,isWall,isTile){

	var cell = $scope.cells[x+','+y+','+z];
	
	// If wall 
	if(isWall){
	    if(!cell){
		$scope.cells[x+','+y+','+z] = {isWall: true};
	    }else{
		cell.isWall = !cell.isWall;
	    }
	    $scope.recalculateLinear();
	}
	else if(isTile){
	    if(!cell){
		$scope.cells[x+','+y+','+z] = {isTile: true, changeFloorTo: z};
	    }
	    $scope.open(x,y,z);
	}
    }

    $scope.open = function(x,y,z) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: '/templates/maze_editor_modal.html',
            controller: 'ModalInstanceCtrl',
            size: 'sm',
	    scope: $scope,
            resolve: {
                x: function(){return x;},
		y: function(){return y;},
		z: function(){return z;}
            }
        });
    };
}]);


// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, x, y, z) {
    $scope.tile = $scope.$parent.cells[x+','+y+','+z];;
    $scope.isStart = $scope.$parent.startTile.x == x && $scope.$parent.startTile.y == y && $scope.$parent.startTile.z == z;
    $scope.height = $scope.$parent.height;
    $scope.z = z;
    $scope.oldFloorDestination = $scope.tile.changeFloorTo;
    $scope.elevatorChanged = function(newValue){
	console.log("old", $scope.oldFloorDestination);
	console.log("new", newValue);
	// Remove the old one
	if($scope.oldFloorDestination != z && $scope.$parent.cells[x+','+y+','+$scope.oldFloorDestination]){
	    console.log("Remove old elevator on " + x+','+y+','+$scope.oldFloorDestination);
	    $scope.$parent.cells[x+','+y+','+$scope.oldFloorDestination].changeFloorTo = $scope.oldFloorDestination;
	}

	// Set the new one
	if($scope.$parent.cells[x+','+y+','+newValue]){
	    console.log("Create new elevator on " +x+','+y+','+newValue + " (1) to floor "+ z);
	    $scope.$parent.cells[x+','+y+','+newValue].changeFloorTo = z;
	}else{
	    console.log("Create new elevator on " +x+','+y+','+newValue + " (2) to floor "+ z);
	    $scope.$parent.cells[x+','+y+','+newValue] = {isTile: true, changeFloorTo: z};
	}
	$scope.oldFloorDestination = newValue;
    }

    $scope.startChanged = function(){
	if($scope.isStart){
            $scope.$parent.startTile.x = x;
            $scope.$parent.startTile.y = y;
            $scope.$parent.startTile.z = z;
        }
    }

    $scope.range = function(n){
        arr = [];
        for (var i=0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }
    $scope.ok = function () {
	$uibModalInstance.close();
    };
});

