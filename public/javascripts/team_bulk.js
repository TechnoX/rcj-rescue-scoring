var app = angular.module("TeamAdmin", ['pascalprecht.translate', 'ngCookies']).controller("TeamAdminController", function ($scope, $http) {
    $scope.competitionId = competitionId
    $http.get("/api/competitions/" + competitionId).then(function (response) {
        $scope.competition = response.data
    })

    $http.get("/api/teams/leagues").then(function (response) {
        $scope.leagues = response.data
        console.log($scope.leagues)
    })

    $scope.addTeam = function () {
        $scope.processing = true;
        $scope.total = obj.length - 1;
        $scope.now = 0;
        next_add();
        /*var team = {name: $scope.teamName, league: $scope.teamLeague, competition: competitionId}
         
         $http.post("/api/teams/createteam", team).then(function (response) {
         console.log(response)
         updateTeamList()
         }, function (error) {
         console.log(error)
         })*/
    }

    next_add = function () {
        $scope.now++;
        console.log($scope.now);
        if ($scope.now > obj.length - 1) {
            $scope.processing = false;
            $scope.completed = true;
            $scope.$apply();
            return;
        }

        var team = {
            name: obj[$scope.now][0],
            league: obj[$scope.now][1],
            competition: competitionId
        };
        $http.post("/api/teams", team).then(function (response) {
            setTimeout(next_add, 100);
        }, function (error) {
            console.log(error)
        })

    }



        console.log("Ready");
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
                    var insert = '<table class="custom"><thead><tr><th>Team name</th><th>League</th></tr></thead><tbody>';
                    for (var i = 1; i < obj.length; i++) {
                        insert += '<tr>';
                        for (var j = 0; j < obj[i].length; j++) {
                            insert += '<td>';
                            insert += obj[i][j];
                            insert += '</td>';
                        }
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
