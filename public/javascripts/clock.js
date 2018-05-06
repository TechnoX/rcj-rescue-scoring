var app = angular.module("Clock", ['pascalprecht.translate', 'ngCookies']);
app.controller("ClockController", ['$scope', '$http', '$translate', '$timeout', function ($scope, $http, $translate, $timeout) {
    $scope.competitionId = competitionId

    date = new Date();
    $scope.time = date.getTime();
    $scope.runs = [];
    $scope.timeDep = 0;
    var lr=[];
    var mr=[];
   
    function tick() {
            date = new Date();
            $scope.time = Number(date.getTime()) + Number($scope.timeDep);
            //console.log($scope.time);
            //$scope.$apply();
            $timeout(tick, 500);
        }


    tick();
    
    $scope.range = function (n) {
        arr = [];
        for (var i = 0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }
    
    // launch socket.io
    socket = io(window.location.origin, {
        transports: ['websocket']
    });
    if (typeof competitionId !== 'undefined') {
        socket.emit('subscribe', 'runs/line/' + competitionId + '/status');
        socket.emit('subscribe', 'runs/maze/' + competitionId + '/status');

        socket.on('Lchanged', function (data) {
            update_line_list();
            $scope.$apply();
            //console.log($scope.runs);
            console.log("Updated view from socket.io");
        });
        
        socket.on('Mchanged', function (data) {
            update_maze_list();
            $scope.$apply();
            //console.log($scope.runs);
            console.log("Updated view from socket.io");
        });
    }
    
    $http.get("/api/competitions/" + competitionId +
        "/LineNL/fields").then(function (response) {
        $scope.fields = response.data
        $http.get("/api/competitions/" + competitionId +
            "/LineWL/fields").then(function (response) {
            $scope.fields = $scope.fields.concat(response.data)
            $http.get("/api/competitions/" + competitionId +
                "/Maze/fields").then(function (response) {
                $scope.fields = $scope.fields.concat(response.data)
                console.log($scope.fields);
            })
        })
    })
    
    
    function update_line_list(){
        $http.get("/api/competitions/" + competitionId +
            "/line/runs?populate=true&minimum=true&ended=true").then(function (response) {
            lr = response.data
            console.log(lr);
            $scope.runs=[];
            for(let run of lr){
                if(run.status < 4){
                    if(!$scope.runs[run.field._id]) $scope.runs[run.field._id]=[];
                    try{
                         var teamname = run.team.name.split(' ');
                        run.teamCode = teamname[0];
                        run.teamName = teamname[1];
                        for(let i = 2; i < teamname.length;i++){
                            run.teamName = run.teamName + " " + teamname[i];
                        }
                        $scope.runs[run.field._id].push(run);
                    }
                    catch(e){
                        
                    }
                   
                }
            }
            for(let run of mr){
                if(run.status < 4){
                    if(!$scope.runs[run.field._id]) $scope.runs[run.field._id]=[];
                    try{
                        var teamname = run.team.name.split(' ');
                        run.teamCode = teamname[0];
                        run.teamName = teamname[1];
                        for(let i = 2; i < teamname.length;i++){
                            run.teamName = run.teamName + " " + teamname[i];
                        }
                        $scope.runs[run.field._id].push(run);
                    }
                    catch(e){
                        
                    }
                    
                }
            }
            
            console.log($scope.runs);

            
        });
    }
    
    function update_maze_list(){
        $http.get("/api/competitions/" + competitionId +
            "/maze/runs?populate=true&minimum=true&ended=true").then(function (response) {
            mr = response.data
            console.log(mr);
            $scope.runs=[];
            for(let run of lr){
                if(run.status < 4){
                    if(!$scope.runs[run.field._id]) $scope.runs[run.field._id]=[];
                    try{
                        var teamname = run.team.name.split(' ');
                        run.teamCode = teamname[0];
                        run.teamName = teamname[1];
                        for(let i = 2; i < teamname.length;i++){
                            run.teamName = run.teamName + " " + teamname[i];
                        }
                        $scope.runs[run.field._id].push(run);
                    }
                    catch(e){
                        
                    }
                    
                }
            }
            for(let run of mr){
                if(run.status < 4){
                    if(!$scope.runs[run.field._id]) $scope.runs[run.field._id]=[];
                    try{
                         var teamname = run.team.name.split(' ');
                        run.teamCode = teamname[0];
                        run.teamName = teamname[1];
                        for(let i = 2; i < teamname.length;i++){
                            run.teamName = run.teamName + " " + teamname[i];
                        }
                        $scope.runs[run.field._id].push(run);
                    }
                    catch(e){
                        
                    }
                   
                }
            }
            
            console.log($scope.runs);
            

            
        });
    }
    
    update_line_list();
    update_maze_list();


    

}]);


$(window).on('beforeunload', function () {
    socket.emit('unsubscribe', 'runs/line/' + competitionId + '/status');
    socket.emit('unsubscribe', 'runs/maze/' + competitionId + '/status');
});