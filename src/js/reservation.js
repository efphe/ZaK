/* 
 * localStorage.editOccupancyOid
 * localStorage.editOccupancyRid
 */

zakEditReservation= false;
zakRoomsSetups= new Array();
_tempChildren= new Array();

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
    var red= child.red;
    res+= '<tr class="rchildren"><td>Child</td><td>Age: ' + age + ' (-' + red + '%)</td>'; 
    res+= '<td><b><a href="javascript:delChild(' + age +','+red + ')">Delete</a></b></td></tr>'; 
  }
  $('#table_occupancy').append(res);
}

function delChild(age, red) {
  var newchi= new Array();
  for (var i= 0; i< _tempChildren.length; i++) {
    var c= _tempChildren[i];
    if (c.age != age || c.red != red) newchi.push(c);
  }
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
    $('#adults').val(adults);
    _tempChildren= children;
    designChildren();
  }
}

function designReservation() {
  llLoadRoomSetups(function(ses, recs) {
    for (var i= 0; i< recs.rows.length; i++ ) 
      zakRoomsSetups.push(recs.rows.item(i));

    var res= '<option value="">--</option>';
    for (var j= 0; j< zakRoomsSetups.length; j++) {
      var z= zakRoomsSetups[j];
      res+= '<option value="' + z.id + '">' + z.name + '</option>';
    }
    $('#selectSetup').empty().html(res);

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
  var red= $('#children_red').val();
  if (parseInt(age) != age || parseInt(red) != red) {
    humanMsg.displayMsg('Please, specify good values', 1);
    return;
  }
  _tempChildren.push({age: age, red: red});
  designChildren();
  $.modal.close();
}


$(document).ready(function() {
  designReservation();
});
