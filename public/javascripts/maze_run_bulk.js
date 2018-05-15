var xmlHttp;

var app = angular.module("RunAdmin", ['ngTouch','pascalprecht.translate', 'ngCookies']).controller("RunAdminController", function ($scope, $http) {
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
     $scope.maps = []
    for (let i = 0, j = 0; i < response.data.length; i++) {
        if (!response.data[i].parent) {
            $scope.maps[j] = response.data[i]
            j++;
        }
    }
  })
    
  function find(array,key){
    for(let data of array){
        if(data.name === key)return data._id;
    }
    swal("Error", key + " is not exist!", "error");
    return -1;
  }
    
    function findT(array,key){
        for(let data of array){
            if(data.name === key)return data._id;
        }
        var group = parseInt(key);
        if(isNaN(group)){
            swal("Error", key + " is not exist!", "error");
            return -1;
        }
        else{
            return null;
        }
    }
    
    function findTG(array,key){
        for(let data of array){
            if(data.name === key)return null;
        }
        var group = parseInt(key);
        if(!isNaN(group)){
            
            return group;
        }
        swal("Error", key + " is not exist!", "error");
        return -1;
    }

  
  $scope.addRun = function () {
    $scope.processing = true;
    $scope.error = false;
    $scope.total = obj.length - 1;
    $scope.now = 0;
    next_add();
  }
  
  $scope.go = function (path) {
        window.location = path
    }
  
  exe = function () {
    var time = new Date(obj[$scope.now][4]);
    var run = {
            round: find($scope.rounds,obj[$scope.now][0]),
            team: findT($scope.teams,obj[$scope.now][1]),
            group: findTG($scope.teams,obj[$scope.now][1]),
            field: find($scope.fields,obj[$scope.now][3]),
            map: find($scope.maps,obj[$scope.now][2]),
            competition: competitionId,
            startTime: time.getTime()
    }
    
    $http.post("/api/runs/maze", run).then(function (response) {
      next_add();
    }, function (error) {
      console.log(error)
      swal("Oops!", error.data.err, "error");
      $scope.processing = false;
      $scope.completed = false;
      $scope.error = true;
      if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
             $scope.$apply();
      }
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
      if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
             $scope.$apply();
      }
      return;
    }
    setTimeout(exe, 10);
    
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
