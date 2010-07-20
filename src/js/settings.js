function loadPropertySettings() {
  var pid= getActiveProperty()['id'];
  llGetPropertySettings(pid, 
    function(ses, recs, sets) {
      $('#vatname').val(sets.vatSettingsName); 
      $('#vatperc').val(sets.vatSettingsPerc); 
    });
}

function saveVatSettings() {
  var vn= $('#vatname').val();
  var vp= $('#vatperc').val();
  var pid= getActiveProperty()['id'];
  llGetPropertySettings(pid,
    function(ses, recs, sets) {
      sets.vatSettingsPerc= vp;
      sets.vatSettingsName= vn;
      var ssets= JSON.stringify(sets);
      if (sets.defaultSettings) 
        var qry= 'insert into psettings (settings, id_property) values (?,?)';
      else
        var qry= 'update psettings set settings = ? where id_property = ?';
      ses.executeSql(qry, [ssets, pid],
        function(ses, recs) {
          humanMsg.displayMsg('Sounds good');
        },
        function(ses, err) {
          humanMsg.displayMsg('Error there :/ (' + err.message + ')');
        });
    });
}

$(document).ready(function() {
  loadPropertySettings();
});
