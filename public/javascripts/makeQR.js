function obj2base64(obj) {
    var utf16 = JSON.stringify(obj);
    var utf8 = encodeURIComponent(utf16);
    var raw = zip_deflate(utf8);
    var base64 = btoa(raw);
    return base64;
}

var qr_timeout;

function stopMakeQR(){
    clearTimeout(qr_timeout);
}

function createMultiQR(obj, qr_id, length) {
  console.log(obj);
  var base64 = obj2base64(obj);

  var data_list = [];
  for (var i = 0; i < base64.length; i += length) {
    data_list.push(base64.slice(i, i + length));
  }

  var idx = 0;
  var task = function() {
    $('#' + qr_id).empty();
    if (idx < 0) {
      return;
    }
    qr_timeout = setTimeout(task, 1000 + Math.random() * 400);

    $('#' + qr_id).empty().qrcode(
      idx + "_" + data_list.length + ":" + data_list[idx]
    );

    ++idx;
    if (idx >= data_list.length) {
      idx = 0;
    }
  }

  task();

  return function() {
    idx = -1;
  }
}
