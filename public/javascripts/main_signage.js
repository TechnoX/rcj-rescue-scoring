var contentFadeInTime = 700;
var contentFadeOutTime = 700;
var contentJsonUrl = "/api/signage/" + sigId + "/content";

var newsEffectSpeed = 1000;
var newsSwitchDelay = 10000;
var newsEasing = "swing";
var newsJsonUrl = "/api/signage/" + sigId + "/news";

var frame = {
    "iframe": ["#iframe0", "#iframe1"],
    "img": ["#img0", "#img1"],
    "movie": ["#movie0", "#movie1"]
};
var dispId = 0;
var dispType = "iframe";
var prevType = "iframe";
var loadType = "iframe";
var contentList = ["dummy"];

var i = 0; // 表示中のコンテンツ番号
var duration = 5; // コンテンツの表示時間
function resize() {
    target = frame[dispType][dispId];
    scrWidth = $(window).width();
    scrHeight = $(window).height() - $("#footer").height();
    $("#content").css({
        "height": scrHeight
    });
    if (dispType == "img") {
        imgWidth = $(target).width();
        imgHeight = $(target).height();
        if (imgWidth / imgHeight < scrWidth / scrHeight) {
            // スクリーンに対して縦長
            $(target).css({
                "width": imgWidth * scrHeight / imgHeight,
                "height": scrHeight
            });
        } else {
            // スクリーンに対して横長;
            $(target).css({
                "width": scrWidth,
                "height": imgHeight * scrWidth / imgWidth
            });
        }
    } else if (dispType == "iframe") {
        $(target).css({
            "width": scrWidth,
            "height": scrHeight
        });
    } else if (dispType == "movie") {
        $(target).css({
            "width": scrWidth,
            "height": scrHeight
        });
    }
    var hspace = scrHeight - $(target).height();
    $(target).css({
        "margin-top": hspace > 0 ? hspace / 2 : 0,
        "margin-bottom": hspace > 0 ? hspace / 2 + 1 : 0
    });
}
$(window).on('load', function () {
    console.log("window load");
    resize();
    $(frame[dispType][dispId]).fadeIn(contentFadeInTime);
});
$(window).on('resize', function () {
    resize();
});

if (document.readyState === "complete" ||
    (document.readyState !== "loading" && !document.documentElement.doScroll)) {
    onReady();
} else {
    document.addEventListener("DOMContentLoaded", onReady);
}
/* コンテンツ画面の実装 */
function loadContent(data) {
    contentList = data.content;
    console.log(contentList);
}

function onReady() {
    timestamp = (contentJsonUrl.indexOf("?") == -1 ? "?" : "&") + "timestamp=" + (new Date()).getTime();
    $.getJSON(contentJsonUrl + timestamp, null, loadContent);
    var state = 0; // 0: load 1: change content 2: go to state0
    var passedsec = 0; // 経過時間
    var timestamp; // JSON取得時のキャッシュを防ぐためにURLにtimestampを含ませる
    setInterval(function () {
            passedsec++;
            //console.log(passedsec + "       Status: " + state);
            if (state == 0) {
                console.log("load");
                loadType = contentList[i]["type"];
                $(frame[loadType][1 - dispId]).attr('src', contentList[i]["url"]);
                state = 1;
                if (i + 1 == contentList.length) {
                    timestamp = (contentJsonUrl.indexOf("?") == -1 ? "?" : "&") + "timestamp=" + (new Date()).getTime();
                    $.getJSON(contentJsonUrl + timestamp, null, loadContent);
                }
            } else if (state == 1) {
                if (passedsec > duration - 1) {
                    state = 2;
                    passedsec = 0;
                    console.log("change");
                    dispId = 1 - dispId;
                    dispType = loadType;
                    $(frame[dispType][dispId]).css({
                        "width": "",
                        "height": ""
                    });
                    resize();
                    $(frame[dispType][dispId]).delay(contentFadeOutTime).fadeIn(contentFadeInTime);
                    $(frame[prevType][1 - dispId]).fadeOut(contentFadeOutTime);
                    if (dispType == "movie") {
                        //再生開始
                        $(frame[dispType][dispId])[0].play();
                        $(frame[dispType][dispId])[0].addEventListener("ended", function () {
                            console.log("Movie End!");
                            passedsec = 600;
                        }, false);
                        duration = 600;
                    } else {
                        duration = contentList[i]["duration"];
                    }
                    prevType = dispType;
                    if (i + 1 == contentList.length) i = 0;
                    else i++;
                }
            } else if (state == 2) {
                if (passedsec >= 1) {
                    state = 0;
                    passedsec = 0;
                }
            }
    }, 1000);
    /* ニュースバーの実装 */
    function loadNews(data) {
        newsList = data.news;
        console.log(newsList);
    }
    var newsList = Array();
    var newsOrder = 0;
    var newsElm = ["#news0", "#news1"];
    var newsState = 0;
    var newsWidth = $("#footer").width();
    timestamp = (newsJsonUrl.indexOf("?") == -1 ? "?" : "&") + "timestamp=" + (new Date()).getTime();
    $.getJSON(newsJsonUrl + timestamp, null, loadNews);
    $(newsElm[newsState]).css({
        left: (newsWidth),
        display: 'block',
        opacity: '0'
    }).
    animate({
        left: '0',
        opacity: '1'
    }, newsEffectSpeed, newsEasing);
    setInterval(function () {
        $(newsElm[newsState]).animate({
            left: (-(newsWidth)),
            opacity: '0'
        }, newsEffectSpeed, newsEasing);
        newsState = 1 - newsState;
        $(newsElm[newsState]).text(newsList[newsOrder]);
        newsOrder++;
        if (newsOrder == newsList.length) {
            timestamp = (newsJsonUrl.indexOf("?") == -1 ? "?" : "&") + "timestamp=" + (new Date()).getTime();
            $.getJSON(newsJsonUrl + timestamp, null, loadNews);
            newsOrder = 0;
        }
        $(newsElm[newsState]).css({
            left: (newsWidth),
            display: 'block',
            opacity: '0'
        }).
        animate({
            left: '0',
            opacity: '1'
        }, newsEffectSpeed, newsEasing);
    }, newsSwitchDelay);
}



(function launchSocketIo() {
    // launch socket.io
    socket = io(window.location.origin, {
        transports: ['websocket']
    });
    if (typeof sigId !== 'undefined') {
        socket.emit('subscribe', 'signage/' + sigId);

        socket.on('time', function (time) {
            console.log(time);      
            console.log("Updated view from socket.io");
            force_reload(time);
            
        });
        socket.on('disconnect', function() {
           socket.emit('subscribe', 'signage/' + sigId)
        })
    }


})();

function force_reload(st){
    var date = new Date() ;
    var time = date.getTime();
    if(time >= st){
        location.reload();
    }
    else{
        setTimeout(force_reload,1,st);
    }
    
}

$(window).on('beforeunload', function () {
    socket.emit('unsubscribe', 'signage/' + sigId);
});
