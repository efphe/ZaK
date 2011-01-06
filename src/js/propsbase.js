function setActiveProperty(prop, cbs, cbe) {
  if (parseInt(prop) != prop) {
    localStorage.activeProperty= JSON.stringify(prop);
    return;
  }
  llGetProperties(
      function(ses, recs) {
        var i;
        for(i=0;i<recs.rows.length;i++) {
          if (recs.rows.item(i)['id'] == prop) {
            setActiveProperty(recs.rows.item(i));
            cbs();
          }
        }
      },
      function(ses, err) {
        humanMsg.displayMsg('Error selecting property: ' + err.message);
      });
}

function getModalNewFly(f, g) {
  llLoadRooms(getActiveProperty().id, function(ses, recs) {
    var _modalNewRes= '' + 
    ' <div id="addNewFlyReservation" style="display:none" class="zakmodal">'+
    '<h1>'+_('Add a new reservation')+'</h1>'+
    '<h2>'+_('Please, insert reservation data')+'</h2>'+
    '<table>'+
    '<tr><td>'+_('Arrival')+':</td><td id="flyReservationWhenTd">'+
    '<input type="text" style="width:150px" id="flyReservationWhen"></input></td></tr>'+
    '<tr>'+
    '<td>'+_('Nights')+':'+
    '</td>'+
    '<td>'+
    '<select id="addNewFlyReservationNightsCmb">'+
    '<option value="z" selected="selected">--</option>'+
    '<option value="1">1</option>'+
    '<option value="2">2</option>'+
    '<option value="3">3</option>'+
    '<option value="4">4</option>'+
    '<option value="5">5</option>'+
    '<option value="6">6</option>'+
    '<option value="7">7</option>'+
    '<option value="8">8</option>'+
    '<option value="9">9</option>'+
    '<option value="10">10</option>'+
    '<option value="11">11</option>'+
    '<option value="12">12</option>'+
    '<option value="13">13</option>'+
    '<option value="14">14</option>'+
    '<option value="15">15</option>'+
    '</select>'+
    '</td>'+
    '</tr>'+
    '<tr><td>'+_('Room')+'</td><td>'+
    '<select id="addNewFlyReservationRid">';
    for (var i= 0; i< recs.rows.length;i++) {
      var room= recs.rows.item(i);
      _modalNewRes+= '<option value="' + room.id + '">' + room.code + '</option>';
    }
    _modalNewRes+= '</select></td></tr>'+
    '<tr>'+
    '<td>'+
    '          '+_('Customer')+
    '</td>'+
    '<td>'+
    '<input type="text" id="addNewFlyReservationCustomer"></input>'+
    '</td>'+
    '</tr>'+
    '<tr>'+
    '<td>'+
    '          Status:'+
    '</td>'+
    '<td>'+
    '<select id="addNewFlyReservationStatus">'+
    '<option value="1" selected="selected">Confirmed</option>'+
    '<option value="2">Not confirmed</option>'+
    '<option value="3">Checkin\'ed</option>'+
    '<option value="4">Option</option>'+
    '</select>'+
    '</td>'+
    '</tr>'+
    '<tr>'+
    '<td>'+
    '          '+_('Go to')+':'+
    '</td>'+
    '<td>'+
    '<select id="newflyact"><option value="0">Tableau</option><option value="1">Details</option></select>'+
    '</td>'+
    '</tr>'+
    '</table>'+
    '<div style="float:right">'+
    '<a style="color:#36ff00;font-weight:bold" href="javascript:_addNewFlyReservation()">'+_('Continue')+'</a> '+
    '<a style="color:red;font-weight:bold" href="javascript:$.modal.close()">Cancel</a>'+
    '</div>'+
    '<br/>'+
    '</div>';
    f(_modalNewRes);
  }, g);
}

function flyReservation() {
  $('#addNewFlyReservation').remove();
  getModalNewFly(function(h) {
    $('body').append(h);
    $('#flyReservationWhen').datepicker({dateFormat: 'dd/mm/yy'});
    $('#addNewFlyReservation').modal();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error here: ' + err.message);
      return;
  });
}
function _addNewFlyReservation() {
  var cust= $('#addNewFlyReservationCustomer').val();
  if (!cust) {
    humanMsg.displayMsg(_('Specify a valid customer'));
    return;
  }
  var nights= $('#addNewFlyReservationNightsCmb').val();
  if (parseInt(nights) != nights) {
    humanMsg.displayMsg(_('Specify a valid number of nights'));
    return;
  }
  var sta= $('#addNewFlyReservationStatus').val();
  if (parseInt(sta) != sta || ! ZAK_MAP_STATUS[parseInt(sta)]) {
    humanMsg.displayMsg(_('Specify a valid reservation status'));
    return;
  }
  var rid= $('#addNewFlyReservationRid').val();
  var sday= $('#flyReservationWhen').val();
  var sday= unixDate(sday);
  llNewOccupancy(getActiveProperty()['id'], false, sta, rid, sday, nights, cust, false,
    function(ses, recs) {
      if (!ses) {
        humanMsg.displayMsg(_('Not enough free days for this reservation/room'), 1);
        return;
      }
      if ($('#newflyact').val() == '1') {
        ses.executeSql('select id,id_reservation from occupancy where id = (select max(id) from occupancy)', [],
          function(ses, recs) {
            var r= recs.rows.item(0);
            localStorage.editOccupancyOid= r.id;
            localStorage.editOccupancyRid= r.id_reservation;
            goToSameDirPage('reservation');
            return;
          }, function(ses, err) {
            zakTableau.loadRooms([rid]);
            $.modal.close();
            humanMsg.displayMsg('Welcome ' + cust);
          });
      }
      else {
        localStorage.zakTableauDfrom= sday - (86400*3);
        goToSameDirPage('tableau');
      }
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message);
    });
}

function getActiveProperty() {
  try {
    return JSON.parse(localStorage.activeProperty);
  } catch(e) {return false;}
}
