/* 
 * localStorage.editOccupancyOid
 * localStorage.editOccupancyRid
 */

zakEditReservation= false;
zakRoomsSetups= new Array();
_tempChildren= new Array();
_tempExtras= {};
_zakYourVat= false;

function getResExtras() {
  try {
    return JSON.parse(zakEditReservation.extras);
  } catch(e) {return []};
}

function designOccupancy() {
  llLoadOccupancy(localStorage.editOccupancyOid, function(ses, recs) {
    _designOccupancy(recs.rows.item(0));
  });
}

function designChildren() {
  var res= '';
  $('.rchildren').remove();
  for (var i= 0; i< _tempChildren.length; i++) {
    var child= _tempChildren[i];
    var age= child.age;
    res+= '<tr class="rchildren"><td>Child</td><td>Age: ' + age + '</td>'; 
    res+= '<td><b><a href="javascript:delChild(' + age +','+ i + ')">Delete</a></b></td></tr>'; 
  }
  $('#table_occupancy').append(res);
  $('#childrenCounter').val(_tempChildren.length);
}

function delChild(age, j) {
  var newchi= new Array();
  for (var i= 0; i< _tempChildren.length; i++)
    if (i!=j) newchi.push(_tempChildren[i]);
  _tempChildren= newchi;
  designChildren();
}

function _designOccupancy(aocc) {
  $('#oremarks').val(aocc.remarks) || '';
  $('#selOccupancy').val(aocc.id_room);
  $('#selectSetup').val(aocc.id_room_setup || '');
  $('#ocustomer').val(aocc.customer || '');

  var occupancy= aocc.occupancy;
  if (!occupancy) {
    $('#adults').val(1);
    $('#childrenCounter').val(0);
  } else {
    occupancy= JSON.parse(occupancy);
    var adults= occupancy.adults;
    var children= occupancy.children;
    $('#childrenCounter').val(children.length);
    $('#adults').val(adults);
    _tempChildren= children;
    designChildren();
  }
}

function designExtras() {
  var extras= getResExtras();
  if (extras.length == 0) {
    $('#assignedExtras').empty();
    return;
  }
  var res= '<table class="assignedExtras">', e;
  for (var i= 0; i< extras.length; i++) {
    e= extras[i];
    console.log(e);
    res+= '<tr><td><b id="extra_id_' + e.id +'">' + e.name + '</b>:</td>'; 
    res+= '<td><input class="extraHow" type="text" id="extra_how_' + e['id'];
    res+= '" value="' + e['how'] + '"></input></td>'; 
    res+= '<td><input class="extraCost" type="text" id="extra_cost_' + e['id'];
    res+= '" value="' + parseFloat(e['cost']).toFixed(2) + '"></input></td>'; 
    res+= '<td><a href="javascript:removeAssignedExtra(' + e['id'] + ')"><b>Delete</b></a></td>';
    res+= '</tr>';
  }
  res+= '<tr><td colspan="4" style="text-align:center">';
  res+= '<input type="submit" value="Update extras" onclick="saveUpdatedExtras()">';
  res+= '</input></td></tr></table>';
  $('#assignedExtras').html(res);
}

function designMain() {
  $('#rremarks').val(zakEditReservation.remarks || '');
  designExtras();
}

function designReservation(noOccupancy) {
  llLoadRoomSetups(function(ses, recs) {
    for (var i= 0; i< recs.rows.length; i++ ) 
      zakRoomsSetups.push(recs.rows.item(i));

    var res= '<option value="">--</option>';
    for (var j= 0; j< zakRoomsSetups.length; j++) {
      var z= zakRoomsSetups[j];
      res+= '<option value="' + z.id + '">' + z.name + '</option>';
    }
    $('#selectSetup').empty().html(res);

    llLoadExtras(function(ses, recs) {
      var eres= '';
      for (var k= 0; k< recs.rows.length; k++) {
        var e= recs.rows.item(k);
        eres+= '<option value="' + e.id + '">' + e.name + '</option>';
        _tempExtras[e.id]= {cost: e.cost, perday: e.perday, name: e.name};
      }
      $('#selectExtra').empty().html(eres);
    });

    var r= llGetReservationFromRid(localStorage.editOccupancyRid,
      function(reservation) {
        zakEditReservation= reservation;

        var rooms= zakEditReservation.rooms;
        var srooms= '';
        for (j= 0; j< rooms.length; j++) {
          var room= rooms[j];
          srooms+= '<option value="' + room.id + '">' + room.name + '</option>';
        }
        $('#selOccupancy').empty().html(srooms);

        designMain();
        if (!noOccupancy) 
          designOccupancy();
      });
  });
}

function saveOccupancy() {
  var ocust= $('#ocustomer').val();
  var ads= $('#adults').val();
  var occ= JSON.stringify({adults: ads, children: _tempChildren});
  llModOccupancy(localStorage.editOccupancyOid, {occupancy: occ, customer: ocust},
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
      designOccupancy();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
    });
}

function saveRooms() {
  var rmrks= $('#oremarks').val();
  var rsetup= $('#selectSetup').val() || '';
  /*var ocust= $('#ocustomer').val() || '';*/
  /*if (!ocust) {*/
  /*humanMsg.displayMsg('Please, insert a valid customer name', 1);*/
  /*return;*/
  /*}*/
  llModOccupancy(localStorage.editOccupancyOid, {remarks: rmrks, id_room_setup: rsetup},
    function(ses, recs) {
      designOccupancy();
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message, 1);
    });
}

function askNewRSetup() {
  var el= $('#addRSetupButton');
  var x= el.offset().left;
  var y= el.offset().top;
  $('#rsetup_div').modal({position: [y,x]});
}
function addRSetup() {
  var rsname= $('#rsetup_name').val();
  llAddRSetup(rsname, localStorage.editOccupancyOid,
    function(ses, recs) {
      $.modal.close();
      humanMsg.displayMsg('Sounds good');
      designReservation();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message, 1);
    });
}

function askChildren() {
  var el= $('#addChildrenButton');
  var x= el.offset().left;
  var y= el.offset().top;
  $('#children_div').modal({position: [y,x]});
}
function addChildren() {
  var age= $('#children_age').val();
  if (parseInt(age) != age) {
    humanMsg.displayMsg('Please, specify good values', 1);
    return;
  }
  _tempChildren.push({age: age});
  designChildren();
  $.modal.close();
}

function askExtra() {
  if (!_zakYourVat) { 
    llGetPropertySettings(getActiveProperty(),
      function(ses, recs, sets) {
      _zakYourVat= sets.vatSettingsPerc;
      askExtra();
      });
    return;
  }
  var el= $('#addExtraButton');
  var x= el.offset().left;
  var y= el.offset().top;
  $('#addextra_div').modal({position: [y,x]});
}

function saveExtra() {
  var ename= $('#extra_name').val();
  var ecost= $('#extra_cost').val();
  var evat= $('#extra_vat').val();
  if (!ename || !checkFloat(ecost) || !checkFloat(evat)) {
    humanMsg.displayMsg('Please, specify good values (decimal values? use the dot [.])');
    return;
  }
  var eperday= $('#extra_perday').val();
  var how= $('#extra_how').val();
  if (!eperday) var atotal= ecost;
  else {
    var n= diffDateDays(zakEditReservation.dfrom, zakEditReservation.dto);
    var atotal= ecost * n;
  }
  atotal*= how;
  var aextras= getResExtras();
  llAddExtra(localStorage.editOccupancyRid, ename, ecost, eperday, evat, how, aextras, atotal,
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
      designReservation();
      $.modal.close();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
      $.modal.close();
    });
}

function assignExtra() {
  var eid= $('#selectExtra').val();
  var how= $('#selectExtraHow').val();
  var e= _tempExtras[eid];
  var ecost= parseFloat(e.cost);
  var epd= e.perday;
  var ename= e.name;
  var evat= e.vat;
  console.log(ecost);
  if (epd) {
    var d= diffDateDays(zakEditReservation.dfrom, zakEditReservation.dto);
    var etotal= ecost * d;
  } else
    var etotal= ecost;
  etotal*= parseInt(how);

  var extras= getResExtras();
  var found= false;
  for (var i= 0; i< extras.length; i++) {
    if (extras[i].id == eid) {
      extras[i].cost= parseFloat(extras[i].cost) + etotal;
      extras[i].how=  parseInt(extras[i].how) + parseInt(how);
      found= true;
      break
    }
  }
  if (!found) {
    extras.push({name: ename, cost: etotal, id: eid, how: how, vat: evat});
  }
  extras= JSON.stringify(extras);
  llModReservation(localStorage.editOccupancyRid, {extras: extras},
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
      designReservation();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
    });
}

function removeAssignedExtra(eid) {
  var extras= getResExtras();
  var newextras= [];
  for (var i= 0; i< extras.length; i++) {
    var e= extras[i];
    if (e.id != eid) newextras.push(e);
  }
  newextras= JSON.stringify(newextras);
  llModReservation(localStorage.editOccupancyRid, {extras: newextras},
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
      designReservation(1);
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
    });
}

function saveUpdatedExtras() {
  var extras= getResExtras();
  for (var i= 0; i< extras.length; i++) {
    var e= extras[i];
    var ecost= $('#extra_cost_' + e.id).val();
    var ehow= $('#extra_how_'+ e.id).val();
    if (parseInt(ehow) != ehow || !checkFloat(ecost) ) {
      humanMsg.displayMsg('Please, specify good values (decimal? use the "." [dot])');
      return;
    }
    e.cost= ecost;
    e.how= ehow;
  }
  extras= JSON.stringify(extras);
  llModReservation(localStorage.editOccupancyRid, {extras: extras},
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
      designReservation(1);
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
    });
}


function saveRemarks() {
  var r= $('#rremarks').val();
  llModReservation(localStorage.editOccupancyRid, {remarks: r},
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message, 1);
    });
}

$(document).ready(function() {
  designReservation();
});
