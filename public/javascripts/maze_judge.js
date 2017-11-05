// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule', 'pascalprecht.translate', 'ngCookies']);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', function ($scope, $uibModal, $log, $timeout, $http) {

    $scope.z = 0;
    $scope.startedTime = false;
    $scope.time = 0;
    $scope.lopProcessing = false;


    $scope.cells = {};
    $scope.tiles = {};

    $http.get("/api/runs/maze/" + runId +
        "?populate=true").then(function (response) {

        console.log(response.data);
        $scope.exitBonus = response.data.exitBonus;
        $scope.field = response.data.field.name;
        $scope.round = response.data.round.name;
        $scope.score = response.data.score;
        $scope.team = response.data.team.name;
        $scope.league = response.data.team.league;
        $scope.competition = response.data.competition;
        $scope.LoPs = response.data.LoPs;

        // Verified time by timekeeper
        $scope.minutes = response.data.time.minutes;
        $scope.seconds = response.data.time.seconds;
        $scope.time = $scope.minutes * 60 * 1000 + $scope.seconds * 1000;

        // Scoring elements of the tiles
        for (var i = 0; i < response.data.tiles.length; i++) {
            $scope.tiles[response.data.tiles[i].x + ',' +
                response.data.tiles[i].y + ',' +
                response.data.tiles[i].z] = response.data.tiles[i];
        }

        // Get the map
        $http.get("/api/maps/maze/" + response.data.map +
            "?populate=true").then(function (response) {
            console.log(response.data);
            $scope.startTile = response.data.startTile;
            $scope.height = response.data.height;
            $scope.slider = {
                    options : {
                        floor: 0,
                        ceil: $scope.height - 1,
                        step: 1,
                        showTicksValues: true
                    }
                };
            $scope.width = response.data.width;
            $scope.length = response.data.length;

            for (var i = 0; i < response.data.cells.length; i++) {
                $scope.cells[response.data.cells[i].x + ',' +
                    response.data.cells[i].y + ',' +
                    response.data.cells[i].z] = response.data.cells[i];
            }

            width = response.data.width;
            length = response.data.length;


        }, function (response) {
            console.log("Error: " + response.statusText);
        });


        $http.put("/api/runs/maze/" + runId, {
            status: 1
        }).then(function (response) {

        }, function (response) {
            console.log("Error: " + response.statusText);
            if (response.status == 401) {
                $scope.go('/home/access_denied');
            }
        });

    }, function (response) {
        console.log("Error: " + response.statusText);
        if (response.status == 401) {
            $scope.go('/home/access_denied');
        }
    });


    $scope.range = function (n) {
        arr = [];
        for (var i = 0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }

    $scope.timeReset = function () {
        $scope.time = 0;
        $scope.minutes = 0;
        $scope.seconds = 0;
        $scope.saveEverything();
    }

    $scope.infochecked = function () {
        $scope.checked = true;
        setTimeout("tile_size()", 10);
        setTimeout("tile_size()", 200);
    }
    $scope.decrement = function () {
        $scope.lopProcessing = true;
        $scope.LoPs--;
        if ($scope.LoPs < 0)
            $scope.LoPs = 0;

        $http.put("/api/runs/maze/" + runId, {
            LoPs: $scope.LoPs,
            time: {
                minutes: Math.floor($scope.time / 60000),
                seconds: (Math.floor($scope.time % 60000)) / 1000
            }
        }).then(function (response) {
            console.log(response);
            $scope.score = response.data.score;
            $scope.lopProcessing = false;
        }, function (response) {
            console.log("Error: " + response.statusText);
        });

    }
    $scope.increment = function () {
        $scope.lopProcessing = true;
        $scope.LoPs++;

        $http.put("/api/runs/maze/" + runId, {
            LoPs: $scope.LoPs,
            time: {
                minutes: Math.floor($scope.time / 60000),
                seconds: (Math.floor($scope.time % 60000)) / 1000
            }
        }).then(function (response) {
            console.log(response);
            $scope.score = response.data.score;
            $scope.lopProcessing = false;
        }, function (response) {
            console.log("Error: " + response.statusText);
        });
    }


    var tick = function () {
        $scope.time += 1000;
        if ($scope.time >= 480000) {
            $scope.startedTime = !$scope.startedTime;
            $scope.minutes = Math.floor($scope.time / 60000)
            $scope.seconds = (Math.floor($scope.time % 60000)) / 1000
            $scope.saveEverything();
            swal("Time Up!", "8 minutes has passed", "info");
        }
        if ($scope.startedTime) {
            $timeout(tick, 1000);
        }
    }

    $scope.toggleTime = function () {
        // Start/stop timer
        $scope.startedTime = !$scope.startedTime;
        if ($scope.startedTime) {
            // Start the timer
            $timeout(tick, $scope.tickInterval);
            $http.put("/api/runs/maze/" + runId, {
                status: 2,
                time: {
                    minutes: Math.floor($scope.time / 60000),
                    seconds: (Math.floor($scope.time % 60000)) / 1000
                }
            }).then(function (response) {

            }, function (response) {
                console.log("Error: " + response.statusText);
            });
        } else {
            // Save everything when you stop the time
            $scope.minutes = Math.floor($scope.time / 60000)
            $scope.seconds = (Math.floor($scope.time % 60000)) / 1000
            $scope.saveEverything();
        }
    }

    $scope.changeExitBonus = function () {
        $http.put("/api/runs/maze/" + runId, {
            exitBonus: $scope.exitBonus,
            time: {
                minutes: Math.floor($scope.time / 60000),
                seconds: (Math.floor($scope.time % 60000)) / 1000
            }
        }).then(function (response) {
            $scope.score = response.data.score;
        }, function (response) {
            console.log("Error: " + response.statusText);
        });
    }

    $scope.isUndefined = function (thing) {
        return (typeof thing === "undefined");
    }


    $scope.tileStatus = function (x, y, z, isTile) {
        // If this is a non-existent tile
        var cell = $scope.cells[x + ',' + y + ',' + z];
        if (!cell)
            return;
        if (!isTile)
            return;

        if (!$scope.tiles[x + ',' + y + ',' + z]) {
            $scope.tiles[x + ',' + y + ',' + z] = {
                scoredItems: {
                    speedbump: false,
                    checkpoint: false,
                    rampBottom: false,
                    rampTop: false,
                    victims: {
                        top: false,
                        right: false,
                        left: false,
                        bottom: false
                    },
                    rescueKits: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0
                    }
                }
            };
        }
        var tile = $scope.tiles[x + ',' + y + ',' + z];

        // Current "score" for this tile
        var current = 0;
        // Max "score" for this tile. Score is added 1 for every passed mission
        var possible = 0;


        if (cell.tile.speedbump) {
            possible++;
            if (tile.scoredItems.speedbump) {
                current++;
            }
        }
        if (cell.tile.checkpoint) {
            possible++;
            if (tile.scoredItems.checkpoint) {
                current++;
            }
        }
        if (cell.tile.rampBottom) {
            possible++;
            if (tile.scoredItems.rampBottom) {
                current++;
            }
        }
        if (cell.tile.rampTop) {
            possible++;
            if (tile.scoredItems.rampTop) {
                current++;
            }
        }
        switch (cell.tile.victims.top) {
            case 'Heated':
                possible++;
                current += tile.scoredItems.victims.top ||
                    tile.scoredItems.rescueKits.top > 0;
                possible++;
                current += (tile.scoredItems.rescueKits.top >= 1);
                break;
            case 'H':
                possible++;
                current += tile.scoredItems.victims.top ||
                    tile.scoredItems.rescueKits.top > 0;
                possible++;
                current += (tile.scoredItems.rescueKits.top >= 2);
                break;
            case 'S':
                possible++;
                current += tile.scoredItems.victims.top ||
                    tile.scoredItems.rescueKits.top > 0;
                possible++;
                current += (tile.scoredItems.rescueKits.top >= 1);
                break;
            case 'U':
                possible++;
                current += tile.scoredItems.victims.top ||
                    tile.scoredItems.rescueKits.top > 0;
                break;
        }
        switch (cell.tile.victims.right) {
            case 'Heated':
                possible++;
                current += tile.scoredItems.victims.right ||
                    tile.scoredItems.rescueKits.right > 0;
                possible++;
                current += (tile.scoredItems.rescueKits.right >= 1);
                break;
            case 'H':
                possible++;
                current += tile.scoredItems.victims.right ||
                    tile.scoredItems.rescueKits.right > 0;
                possible++;
                current += (tile.scoredItems.rescueKits.right >= 2);
                break;
            case 'S':
                possible++;
                current += tile.scoredItems.victims.right ||
                    tile.scoredItems.rescueKits.right > 0;
                possible++;
                current += (tile.scoredItems.rescueKits.right >= 1);
                break;
            case 'U':
                possible++;
                current += tile.scoredItems.victims.right ||
                    tile.scoredItems.rescueKits.right > 0;
                break;
        }
        switch (cell.tile.victims.bottom) {
            case 'Heated':
                possible++;
                current += tile.scoredItems.victims.bottom ||
                    tile.scoredItems.rescueKits.bottom > 0;
                possible++;
                current += (tile.scoredItems.rescueKits.bottom >= 1);
                break;
            case 'H':
                possible++;
                current += tile.scoredItems.victims.bottom ||
                    tile.scoredItems.rescueKits.bottom > 0;
                possible++;
                current += (tile.scoredItems.rescueKits.bottom >= 2);
                break;
            case 'S':
                possible++;
                current += tile.scoredItems.victims.bottom ||
                    tile.scoredItems.rescueKits.bottom > 0;
                possible++;
                current += (tile.scoredItems.rescueKits.bottom >= 1);
                break;
            case 'U':
                possible++;
                current += tile.scoredItems.victims.bottom ||
                    tile.scoredItems.rescueKits.bottom > 0;
                break;
        }
        switch (cell.tile.victims.left) {
            case 'Heated':
                possible++;
                current += tile.scoredItems.victims.left ||
                    tile.scoredItems.rescueKits.left > 0;
                possible++;
                current += (tile.scoredItems.rescueKits.left >= 1);
                break;
            case 'H':
                possible++;
                current += tile.scoredItems.victims.left ||
                    tile.scoredItems.rescueKits.left > 0;
                possible++;
                current += (tile.scoredItems.rescueKits.left >= 2);
                break;
            case 'S':
                possible++;
                current += tile.scoredItems.victims.left ||
                    tile.scoredItems.rescueKits.left > 0;
                possible++;
                current += (tile.scoredItems.rescueKits.left >= 1);
                break;
            case 'U':
                possible++;
                current += tile.scoredItems.victims.left ||
                    tile.scoredItems.rescueKits.left > 0;
                break;
        }

        if (tile.processing)
            return "processing";
        else if (current > 0 && current == possible)
            return "done";
        else if (current > 0)
            return "halfdone";
        else if (possible > 0)
            return "undone";
        else
            return "";
    }


    $scope.cellClick = function (x, y, z, isWall, isTile) {
        var cell = $scope.cells[x + ',' + y + ',' + z];
        if (!cell)
            return;
        if (!isTile)
            return;


        if (!$scope.tiles[x + ',' + y + ',' + z]) {
            $scope.tiles[x + ',' + y + ',' + z] = {
                scoredItems: {
                    speedbump: false,
                    checkpoint: false,
                    rampBottom: false,
                    rampTop: false,
                    victims: {
                        top: false,
                        right: false,
                        left: false,
                        bottom: false
                    },
                    rescueKits: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0
                    }
                }
            };
        }
        var tile = $scope.tiles[x + ',' + y + ',' + z];

        var hasVictims = (cell.tile.victims.top != "None") ||
            (cell.tile.victims.right != "None") ||
            (cell.tile.victims.bottom != "None") ||
            (cell.tile.victims.left != "None");

        console.log(cell.tile);
        // Total number of scorable things on this tile
        var total = !!cell.tile.speedbump + !!cell.tile.checkpoint +
            !!cell.tile.rampBottom + !!cell.tile.rampTop +
            hasVictims;
        console.log("totalt antal saker", total);
        console.log("Has victims", hasVictims);

        if (total == 1 && !hasVictims) {
            tile.processing = true;
            if (cell.tile.speedbump) {
                tile.scoredItems.speedbump = !tile.scoredItems.speedbump;
            }
            if (cell.tile.checkpoint) {
                tile.scoredItems.checkpoint = !tile.scoredItems.checkpoint;
            }
            if (cell.tile.rampBottom) {
                tile.scoredItems.rampBottom = !tile.scoredItems.rampBottom;
            }
            if (cell.tile.rampTop) {
                tile.scoredItems.rampTop = !tile.scoredItems.rampTop;
            }
            var httpdata = {
                tiles: {
          [x + ',' + y + ',' + z]: tile
                },
                time: {
                    minutes: Math.floor($scope.time / 60000),
                    seconds: (Math.floor($scope.time % 60000)) / 1000
                }
            };
            console.log(httpdata);
            $http.put("/api/runs/maze/" + runId, httpdata).then(function (response) {
                $scope.score = response.data.score;
                tile.processing = false;
            }, function (response) {
                console.log("Error: " + response.statusText);
            });
        } else if (total > 1 || hasVictims) {
            tile.processing = true;
            // Open modal for multi-select
            $scope.open(x, y, z);
        }

    }

    $scope.open = function (x, y, z) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: '/templates/maze_judge_modal.html',
            controller: 'ModalInstanceCtrl',
            size: 'lm',
            resolve: {
                cell: function () {
                    return $scope.cells[x + ',' + y + ',' + z];
                },
                tile: function () {
                    return $scope.tiles[x + ',' + y + ',' + z];
                }
            }
        }).closed.then(function (result) {
            var httpdata = {
                tiles: {
          [x + ',' + y + ',' + z]: $scope.tiles[x + ',' + y + ',' + z]
                },
                time: {
                    minutes: Math.floor($scope.time / 60000),
                    seconds: (Math.floor($scope.time % 60000)) / 1000
                }
            };
            console.log(httpdata);
            $http.put("/api/runs/maze/" + runId, httpdata).then(function (response) {
                $scope.score = response.data.score;
                $scope.tiles[x + ',' + y + ',' + z].processing = false;
            }, function (response) {
                console.log("Error: " + response.statusText);
            });
        });
    };

    $scope.saveEverything = function () {
        var run = {}
        run.exitBonus = $scope.exitBonus;
        run.LoPs = $scope.LoPs;

        // Scoring elements of the tiles
        run.tiles = $scope.tiles;

        run.time = {
            minutes: $scope.minutes,
            seconds: $scope.seconds
        };

        console.log("Update run", run);
        $http.put("/api/runs/maze/" + runId, run).then(function (response) {
            $scope.score = response.data.score;
            console.log("Run updated, got score: ", $scope.score);
        }, function (response) {
            console.log("Error: " + response.statusText);
        });
    };

    $scope.confirm = function () {
        var run = {}
        run.exitBonus = $scope.exitBonus;
        run.LoPs = $scope.LoPs;

        // Scoring elements of the tiles
        run.tiles = $scope.tiles;

        // Verified time by timekeeper
        run.time = {};
        run.time.minutes = $scope.minutes;;
        run.time.seconds = $scope.seconds;
        run.status = 3;

        $http.put("/api/runs/maze/" + runId, run).then(function (response) {
            $scope.score = response.data.score;
            $scope.go('/maze/sign/' + runId)
        }, function (response) {
            console.log("Error: " + response.statusText);
        });
    };

    $scope.go = function (path) {
        window.location = path
    }

}]);


// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, cell, tile) {
    $scope.cell = cell;
    $scope.tile = tile;
    $scope.hasVictims = (cell.tile.victims.top != "None") ||
        (cell.tile.victims.right != "None") ||
        (cell.tile.victims.bottom != "None") ||
        (cell.tile.victims.left != "None");

    $scope.incKits = function (direction) {
        $scope.tile.scoredItems.rescueKits[direction]++;
    }

    $scope.decKits = function (direction) {
        $scope.tile.scoredItems.rescueKits[direction]--;
        if ($scope.tile.scoredItems.rescueKits[direction] < 0) {
            $scope.tile.scoredItems.rescueKits[direction] = 0;
        }
    }

    $scope.ok = function () {
        $uibModalInstance.close();
    };
});


function tile_size() {
    $(function () {
        try {
            var b = $('.tilearea');
            //console.log('コンテンツ本体：' + b.height() + '×' + b.width());
            //console.log('window：' + window.innerHeight);
            var tilesize_w = (b.width() - (40 + 11 * (width + 1))) / width;
            var tilesize_h = (window.innerHeight - (100 + 11 * (length + 1))) /
                length;
            //console.log(width + 'tilesize_w:' + tilesize_w);
            //console.log('tilesize_h:' + tilesize_h);
            if (tilesize_h > tilesize_w) var tilesize = tilesize_w;
            else var tilesize = tilesize_h;

            $('.tile-image-container').css('height', tilesize);
            $('.tile-image-container').css('width', tilesize);
            $('.tile-image').css('height', tilesize);
            $('.tile-image').css('width', tilesize);
            $('.tile-font').css('font-size', tilesize - 10);
            if (b.height() == 0) setTimeout("tile_size()", 500);
        } catch (e) {
            setTimeout("tile_size()", 500);
        }


    });
}

var currentWidth = -1;


$(window).on('load resize', function () {
    if (currentWidth == window.innerWidth) {
        return;
    }
    currentWidth = window.innerWidth;
    var height = $('.navbar').height();
    $('body').css('padding-top', height + 40);
    tile_size();

});

let lastTouch = 0;
document.addEventListener('touchend', event => {
    const now = window.performance.now();
    if (now - lastTouch <= 500) {
        event.preventDefault();
    }
    lastTouch = now;
}, true);
