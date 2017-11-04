var xmlHttp;

var app = angular.module("RunAdmin", ['pascalprecht.translate', 'ngCookies']).controller("RunAdminController", function ($scope, $http) {
  $scope.competitionId = competitionId
  
  $http.get("/api/competitions/" + competitionId).then(function (response) {
    $scope.competition = response.data
  })
  
  $http.get("/api/competitions/" + competitionId +
            "/Maze/teams").then(function (response) {
    $scope.teams = response.data
  })
  $http.get("/api/competitions/" + competitionId +
            "/Maze/rounds").then(function (response) {
    $scope.rounds = response.data
  })
  $http.get("/api/competitions/" + competitionId +
            "/Maze/fields").then(function (response) {
    $scope.fields = response.data
  })
  $http.get("/api/competitions/" + competitionId +
            "/Maze/maps").then(function (response) {
    $scope.maps = response.data
  })
  
  $scope.addRun = function () {
    $scope.processing = true;
    $scope.error = false;
    $scope.total = obj.length - 1;
    $scope.now = 0;
    next_add();
  }
  
  get_round = function () {
    $http.get("/api/competitions/" + competitionId +
              "/rounds/Maze/" + obj[$scope.now][0]).then(function (response) {
      $scope.now_round = response.data;
      setTimeout(get_team, 100);
    }, function (error) {
      console.log(error)
    })
  }
  
  get_team = function () {
    $http.get("/api/competitions/" + competitionId +
              "/teams/Maze/" + obj[$scope.now][1]).then(function (response) {
      $scope.now_team = response.data;
      setTimeout(get_field, 100);
    }, function (error) {
      console.log(error)
    })
  }
  
  get_field = function () {
    $http.get("/api/competitions/" + competitionId +
              "/fields/Maze/" + obj[$scope.now][3]).then(function (response) {
      $scope.now_field = response.data;
      setTimeout(get_map, 100);
    }, function (error) {
      console.log(error)
    })
  }
  
  get_map = function () {
    $http.get("/api/maps/maze/name/" + competitionId + "/" +
              obj[$scope.now][2]).then(function (response) {
      $scope.now_map = response.data;
      setTimeout(exe, 100);
    }, function (error) {
      console.log(error)
    })
  }
  
  exe = function () {
    var time = new Date(obj[$scope.now][4]);
    var run = {
      round      : $scope.now_round[0]._id,
      team       : $scope.now_team[0]._id,
      field      : $scope.now_field[0]._id,
      map        : $scope.now_map[0]._id,
      competition: competitionId,
      startTime  : time.getTime()
    }
    console.log(run)
    
    $http.post("/api/runs/maze", run).then(function (response) {
      setTimeout(next_add, 100);
    }, function (error) {
      console.log(error)
      swal("Oops!", error.data.err, "error");
      $scope.processing = false;
      $scope.completed = false;
      $scope.error = true;
      $scope.$apply();
      return;
    })
    
  }
  
  next_add = function () {
    $scope.now++;
    console.log("NEXT ->" + $scope.now);
    if ($scope.now > obj.length - 1) {
      $scope.processing = false;
      $scope.completed = true;
      $scope.error = false;
      $scope.$apply();
      return;
    }
    setTimeout(get_round, 10);
    
  }
  
  
    
    // File APIに対応しているか確認
    if (window.File) {
      var result = document.getElementById('result');
      var select = document.getElementById('select');
      
      // ファイルが選択されたとき
      select.addEventListener('change', function (e) {
        // 選択されたファイルの情報を取得
        var fileData = e.target.files[0];
        
        var reader = new FileReader();
        // ファイル読み取りに失敗したとき
        reader.onerror = function () {
          alert('ファイル読み取りに失敗しました')
        }
        // ファイル読み取りに成功したとき
        reader.onload = function () {
          // 行単位で配列にする
          obj = $.csv()(reader.result);
          console.log(obj)
          
          // tableで出力
          var insert = '<table class="custom"><thead><tr><th>Round</th><th>Team name</th><th>Map name</th><th>Field name</th><th>Start Time</th></tr></thead><tbody>';
          for (var i = 1; i < obj.length; i++) {
            insert += '<tr>';
            insert += '<td>';
            insert += obj[i][0];
            insert += '</td>';
            
            insert += '<td>';
            insert += obj[i][1];
            insert += '</td>';
            
            insert += '<td>';
            insert += obj[i][2];
            insert += '</td>';
            
            insert += '<td>';
            insert += obj[i][3];
            insert += '</td>';
            
            insert += '<td>';
            insert += new Date(obj[i][4]);
            insert += '</td>';
            insert += '</tr>';
          }
          insert += '</tbody></table>';
          result.innerHTML = insert;
        }
        
        // ファイル読み取りを実行
        reader.readAsText(fileData, 'Shift_JIS');
      }, false);
    }
  
  /* Usage:
   *  jQuery.csv()(csvtext)		returns an array of arrays representing the CSV text.
   *  jQuery.csv("\t")(tsvtext)		uses Tab as a delimiter (comma is the default)
   *  jQuery.csv("\t", "'")(tsvtext)	uses a single quote as the quote character instead of double quotes
   *  jQuery.csv("\t", "'\"")(tsvtext)	uses single & double quotes as the quote character
   *  jQuery.csv(",", "", "\n")(tsvtext)	カンマ区切りで改行コード「\n」
   */
  jQuery.extend({
    csv: function (delim, quote, lined) {
      delim = typeof delim == "string" ? new RegExp("[" + (delim || ",") +
                                                    "]") : typeof delim ==
                                                           "undefined" ? "," : delim;
      quote = typeof quote == "string" ? new RegExp("^[" + (quote || '"') +
                                                    "]") : typeof quote ==
                                                           "undefined" ? '"' : quote;
      lined = typeof lined == "string" ? new RegExp("[" + (lined || "\r\n") +
                                                    "]+") : typeof lined ==
                                                            "undefined" ? "\r\n" : lined;
      
      function splitline(v) {
        // Split the line using the delimitor
        var arr = v.split(delim),
            out = [],
            q;
        for (var i = 0, l = arr.length; i < l; i++) {
          if (q = arr[i].match(quote)) {
            for (j = i; j < l; j++) {
              if (arr[j].charAt(arr[j].length - 1) == q[0]) {
                break;
              }
            }
            var s = arr.slice(i, j + 1).join(delim);
            out.push(s.substr(1, s.length - 2));
            i = j;
          } else {
            out.push(arr[i]);
          }
        }
        
        return out;
      }
      
      return function (text) {
        var lines = text.split(lined);
        for (var i = 0, l = lines.length; i < l; i++) {
          lines[i] = splitline(lines[i]);
        }
        
        // 最後の行を削除
        var last = lines.length - 1;
        if (lines[last].length == 1 && lines[last][0] == "") {
          lines.splice(last, 1);
        }
        
        return lines;
      };
    }
  });
  
  
})
