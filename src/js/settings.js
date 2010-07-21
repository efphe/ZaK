function loadPropertySettings() {
  var pid= getActiveProperty()['id'];
  llGetPropertySettings(pid, 
    function(ses, recs, sets) {
      $('#vatname').val(sets.vatSettingsName); 
      $('#vatperc').val(sets.vatSettingsPerc); 
      $('#vatheader').val(sets.vatSettingsHeader);
    });
}

function saveVatSettings() {
  var vn= $('#vatname').val();
  var vp= $('#vatperc').val();
  var vh= $('#vatheader').val();
  var pid= getActiveProperty()['id'];
  llGetPropertySettings(pid,
    function(ses, recs, sets) {
      sets.vatSettingsPerc= vp;
      sets.vatSettingsName= vn;
      sets.vatSettingsHeader= vh;
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

function askAddType() {
  $('#newIType').modal();
}

function _itypefRow() {
  return '<tr><td><b>Classic Invoice</b></td><td><b>( <a href="javascript:askAddType()">Add</a> )</b></td></tr>';
}
function _itypeRow(iid, name) {
  res= '<tr><td><b>'+name+ '</b></td>'; 
  res+= '<td><b>( <a href="javascript:delItype(' + iid + ')">Del</a> )</b></td></tr>';
  return res;
}

function addNewIType() {
  var name= $('#newitypename').val();
  if (!name) {
    humanMsg.displayMsg('Please, specify a valid name', 1);
    $.modal.close();
    return;
  }
  llNewInvoiceType(name, function(ses, recs) {
    showItypes();
    var iid= recs.insertId;
    $('#titypes').append(_itypeRow(iid, name));
    humanMsg.displayMsg('Sounds good');
    $.modal.close();
  });
}

function delItype(iid) {
  $('#iid_delete').val(iid);
  $('#delItypeDiv').modal();
}

function _delItype() {
  var iid= $('#iid_delete').val();
  llDelItype(iid, function(ses, recs) {
    showItypes();
    $.modal.close();
  });
}

function showItypes() {
  llGetItypes(function(ses, recs) {
    $('#titypes').empty();
    var i;
    var res= _itypefRow();
    console.log(ses);
    console.log(recs);
    console.log('designing itypes: ' + recs.rows.length);
    for(i=0;i<recs.rows.length;i++) {
      var itype= recs.rows.item(i);
      var name= itype.name;
      var iid= itype.id;
      res+= _itypeRow(iid, name);
    }
    $('#titypes').append(res);
  });
}

$(document).ready(function() {
  loadPropertySettings();
  showItypes();
});
