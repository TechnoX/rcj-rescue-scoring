var app = angular.module('HandOver', ['ngTouch', 'ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);
var scope;

// function referenced by the drop target
app.controller('HandOverController', ['$scope', '$uibModal', '$log', '$timeout', '$http', '$translate', '$cookies', '$interval', function ($scope, $uibModal, $log, $timeout, $http, $translate, $cookies, $interval) {
    const http_config = {
        timeout: 10000
    };
    scope = $scope;
    $scope.Rstatus = [];
    $scope.total = 0;
    $scope.targetId = "";
    $scope.league = null;
    $scope.decodeStatus = 0;
    $scope.dataSended = 0;

    function inflate_obj(base64) {
        console.log(base64);
        var raw = atob(base64);
        var utf8 = zip_inflate(raw);
        var utf16 = decodeURIComponent(utf8);
        var obj = JSON.parse(utf16);
        console.log(obj);
        return obj;
    }

    $scope.readRunQr = function (txt) {
        console.log(txt);
            var sp = txt.split(':');
            var num = sp[0].split('_');
            num[0] = Number(num[0]);
            num[1] = Number(num[1]);
            console.log(num[0] + '/' + num[1] + " : " + sp[1]);
            if(!isNaN(num[0])&&!isNaN(num[1])){
                if ($scope.total != num[1]) {
                    $scope.total = num[1];
                    if ($scope.Rstatus.length != num[1]) {
                        for ($scope.Rstatus = []; $scope.Rstatus.length != num[1];) {
                            let tmp = {
                                'status': 0,
                                'data': ''
                            }
                            $scope.Rstatus.push(tmp);
                        }
                    }
                    console.log($scope.Rstatus);
                }
                $scope.Rstatus[num[0]].status = 1;
                $scope.Rstatus[num[0]].data = sp[1];
                console.log($scope.Rstatus);

                let totalst = 0;
                let base64 = "";
                for (let i = 0; i < $scope.Rstatus.length; i++) {
                    totalst += $scope.Rstatus[i].status;
                    base64 += $scope.Rstatus[i].data;
                }
                console.log(totalst);
                if (totalst == $scope.Rstatus.length) { //All QR code readed
                    var run = inflate_obj(base64);
                    clearInterval($scope.decodeInt);
                    $scope.decodeStatus = 0;
                    console.log(run);
                    if(run.evacuationLevel != null){//Line
                        putLine(run);
                    }else{//Maze
                        putMaze(run);
                    }
                }
                $scope.$apply();
            }
    }
    
    $scope.goJudge = function(){
        window.location = $scope.judgeUrl;
    }
    
    $scope.goSign = function(){
        window.location = $scope.signUrl;
    }
    
    $scope.go = function (path) {
        window.location = path;
    }
    
    function putLine(tmp) {
        var run = {}
        run.LoPs = tmp.LoPs;
        run.evacuationLevel = tmp.evacuationLevel;
        run.exitBonus = tmp.exitBonus;
        run.rescueOrder = tmp.rescueOrder;
        run.showedUp = tmp.showedUp;
        run.started = tmp.started;
        run.tiles = tmp.stiles;
        run.retired = tmp.retired;
        run.time = {
            minutes: tmp.time.minutes,
            seconds: tmp.time.seconds
        };
        run.status = tmp.status;
        
        $http.put("/api/runs/line/" + tmp.id, run, http_config).then(function (response) {
            $scope.dataSended = 1;
            $scope.judgeUrl = "/line/judge/" + tmp.id;
            $scope.signUrl = "/line/sign/" + tmp.id;
        }, function (response) {

        });
    };
    
    function putMaze(tmp) {
        var run = {}
        run.exitBonus = tmp.exitBonus;
        run.LoPs = tmp.LoPs;
        run.misidentification = tmp.misidentification;

        // Scoring elements of the tiles
        run.tiles = tmp.tiles;
        run.time = {
            minutes: tmp.time.minutes,
            seconds: tmp.time.seconds
        };
        run.status = tmp.status;

        $http.put("/api/runs/maze/" + tmp.id, run, http_config).then(function (response) {
            $scope.dataSended = 1;
            $scope.judgeUrl = "/maze/judge/" + tmp.id;
            $scope.signUrl = "/maze/sign/" + tmp.id;
        }, function (response) {
        });
    };


}]);



app.run(['$window', function ($window, $rootScope) {
    //ここにonload時にさせたい処理

    var localStream = null;
    var ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    var devices;
    var activeIndex;
    var iosRear = false;
    var postCount = 0;
    var video;
    var stream;

    var decodeImageFromBase64 = function (data, callback) {
        qrcode.callback = callback;
        qrcode.decode(data);
    }

    var decode = function () {
        scope.decodeStatus = 1;
        scope.$apply();
        if (localStream) {
            var canvas = document.getElementById('canvas');
            var ctx = canvas.getContext('2d');
            var h;
            var w;

            w = video.videoWidth;
            h = video.videoHeight;

            canvas.setAttribute('width', w);
            canvas.setAttribute('height', h);
            ctx.drawImage(video, 0, 0, w, h);

            decodeImageFromBase64(canvas.toDataURL('image/png'), function (decodeInformation) {
                var input = document.getElementById('qr');
                if (!(decodeInformation instanceof Error)) {
                    input.value = decodeInformation;
                    scope.readRunQr(decodeInformation);
                }
            });
        }
    }

    function openQRCamera(node) {
        var reader = new FileReader();
        reader.onload = function () {
            node.value = '';
            qrcode.callback = function (res) {
                if (res instanceof Error) {
                    alert('QRコードが見つかりませんでした。QRコードがカメラのフレーム内に収まるよう、再度撮影してください。');
                } else {
                    var qr = document.getElementById('qr');
                    qr.value = res;
                }
            };

            qrcode.decode(reader.result);
        };

        reader.readAsDataURL(node.files[0]);
    }

    var modeChange = function (mode) {
        if (mode === 'camera') {
            document.getElementById('video-input').style.display = 'none';
            document.getElementById('photo-input').style.display = 'block';
            document.getElementById('toCamera').style.display = 'none';
            document.getElementById('toMovie').style.display = 'block';
        } else {
            document.getElementById('video-input').style.display = 'block';
            document.getElementById('photo-input').style.display = 'none';
            document.getElementById('toCamera').style.display = 'block';
            document.getElementById('toMovie').style.display = 'none';
        }
    };

    var startReadQR = function () {
        console.log("START READ QR")
        scope.decodeStatus = 1;
        scope.decodeInt = setInterval(decode, 500);
    };

    var changeCamera = function (index) {
        if (localStream) {
            localStream.getVideoTracks()[0].stop();
        }

        activeIndex = index;
        iosRear = !iosRear;
        //var p = document.getElementById('active-camera');
        //p.innerHTML = devices[activeIndex].name + '(' + devices[activeIndex].id + ')';
        setCamera();
    };

    var setCamera = function () {
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || windiow.navigator.mozGetUserMedia;
        window.URL = window.URL || window.webkitURL;

        var videoOptions;

        if (ios) {
            videoOptions = {
                facingMode: {
                    exact: (iosRear) ? 'environment' : 'user'
                },
                mandatory: {
                    sourceId: devices[activeIndex].id,
                    minWidth: 600,
                    maxWidth: 800,
                    minAspectRatio: 1.6
                },
                optional: []
            };
        } else {
            videoOptions = {
                mandatory: {
                    sourceId: devices[activeIndex].id,
                    minWidth: 600,
                    maxWidth: 800,
                    minAspectRatio: 1.6
                },
                optional: []
            };
        }

        navigator.getUserMedia({
                audio: false,
                video: videoOptions
            },
            function (stream) {
                if (ios) {
                    video.srcObject = stream;
                } else {
                    try {
                        video.srcObject = stream;
                    } catch (error) {
                        console.log(stream);
                        video.src = window.URL.createObjectURL(stream);
                    }
                }
                localStream = stream;
            },
            function (err) {

            }
        );

        startReadQR();
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        modeChange('camera');
        return;
    }

    // カメラ情報取得
    navigator.mediaDevices.enumerateDevices()
        .then(function (cameras) {
            var cams = [];
            cameras.forEach(function (device) {
                if (device.kind === 'videoinput') {
                    cams.push({
                        'id': device.deviceId,
                        'name': device.label
                    });
                }
            });

            devices = cams;
            changeCamera(devices.length - 1);
        })
        .catch(function (err) {
            //alert('カメラが見つかりません');
        });

    video = document.getElementById('video');

    document.getElementById('changeCamera').addEventListener('click', function () {
        var newIndex = activeIndex + 1;
        if (newIndex >= devices.length) {
            newIndex = 0;
        }
        changeCamera(newIndex);
    }, false);

  }]);
