function initEnd() {
  humanMsg.displayMsg('Correctly update: db clean');
  setTimeout(function() {window.location.href= location.protocol + '//' + location.host + '/dashboard';}, 3000);
}

function _akInitSchema() {
  var db= zakOpenDb();
  var dbv= db.version || 0;
  console.log('Local version: ' + dbv);
  $.get('schema?fromversion=' + dbv, function(data) {
    if(!data) {initEnd();return;}
    $.get('version', function(zdbv) {
      console.log('Changing db version: to version: ' + zdbv);
      changeZakVersion(data, zdbv, 
        function(res, recs) {initEnd();},
        function(ses, err) {alert('Error: ' + err.message);});
    });
  });
}

$(document).ready(function() {
    _akInitSchema();
});
