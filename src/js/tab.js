zakInitializedOnce= false;
function setReservationNights() {
  var n= $('#addNewReservationNightsCmb').val();
  $('#addNewReservationNights').val(n);
  $('#addNewReservationNightsCmb').hide();
}

function writeReservationNights() {
  $('#addNewReservationNightsCmb').hide();
}

function _addNewReservation() {
  var cust= $('#addNewReservationCustomer').val();
  if (!cust) {
    humanMsg.displayMsg('Specify a valid customer');
    return;
  }
  var nights= $('#addNewReservationNights').val();
  if (parseInt(nights) != nights) {
    humanMsg.displayMsg('Specify a valid number of nights');
    return;
  }
  var sta= $('#addNewReservationStatus').val();
  if (parseInt(sta) != sta || ! ZAK_MAP_STATUS[parseInt(sta)]) {
    humanMsg.displayMsg('Specify a valid reservation status');
    return;
  }
  var rid= addNewReservationRid;
  var sday= dateAddDays(zakTableau.dfrom, addNewReservationDay);
  console.log('Adding new Reservation: from ' + strDate(sday) + ', nights= ' + nights);
  llNewOccupancy(getActiveProperty()['id'], false, sta, rid, sday, nights, cust, false,
    function(ses, recs) {
      if (!ses) {
        humanMsg.displayMsg('Not enough free days for this reservation/room', 1);
        return;
      }
      if ($('#addNewReservationDetails').is(':checked')) {
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
        zakTableau.loadRooms([rid]);
        $.modal.close();
        humanMsg.displayMsg('Welcome ' + cust);
      }
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message);
    });
}


function copyOccupancy() {
  day= movingAction['day'];
  oid= movingAction['oid'];
  srid= movingAction['srid'];
  drid= movingAction['drid'];

  console.log('Oid: ' + oid);
  console.log('Day: ' + day);
  console.log('Src Rid: ' + srid);
  console.log('Dst Rid: ' + drid);
  if (srid == drid) {
    humanMsg.displayMsg('You can\'t add a new occupancy on the same room', 1);
    $.modal.close();
    return;
  }

  var room= zakTableau.rooms[srid];
  var occ= room.getOccupancy(oid);
  var udfrom= dateAddDays(zakTableau.dfrom, day);
  /*var udto= dateAddDays(udfrom, diffDateDays(occ['dfrom'], occ['dto']));*/
  var customer= $('#copy_customer').val() || 'Unknown';
  var nights= $('#copy_nights').val() || diffDateDays(udfrom, udto);
  var udto= dateAddDays(udfrom, nights);
  $.modal.close();

  llCopyOccupancy(occ, customer, udfrom, udto, drid, 
    function(ses, recs) {
      if (!recs) {
        humanMsg.displayMsg('Not enough space for this reservation');
        return;
      }
      if (srid == drid)
        var toload= [srid];
      else var toload= [srid, drid];
      zakTableau.loadRooms(toload, function() {humanMsg.displayMsg('Sounds good');});
    },
    function(ses, err) {
      humanMsg.displayMsg('Sorry, error: ' + err.message);
    }
  );
}


function moveOccupancy() {
  $.modal.close();
  day= movingAction['day'];
  oid= movingAction['oid'];
  srid= movingAction['srid'];
  drid= movingAction['drid'];

  console.log('Oid: ' + oid);
  console.log('Day: ' + day);
  console.log('Src Rid: ' + srid);
  console.log('Dst Rid: ' + drid);

  var room= zakTableau.rooms[srid];
  var occ= room.getOccupancy(oid);
  var udfrom= dateAddDays(zakTableau.dfrom, day);
  var udto= dateAddDays(udfrom, diffDateDays(occ['dfrom'], occ['dto']));

  llMoveOccupancy(oid, udfrom, udto, drid, 
    function(ses, recs) {
      if (!recs) {
        humanMsg.displayMsg('Not enough space for this reservation');
        return;
      }
      console.log(strDate(udfrom));
      /*var occ= zakTableau.rooms[srid].getOccupancy(oid);*/
      /*var newocc= new Object();*/
      /*for (var k in occ) newocc[k]= occ[k];*/
      /*newocc['dfrom']= udfrom;*/
      /*newocc['dto']= udto;*/
      /*zakTableau.rooms[srid].delOccupancy(oid);*/
      /*zakTableau.rooms[drid].addOccupancy(newocc);*/
      if (srid == drid)
        var toload= [srid];
      else var toload= [srid, drid];
      zakTableau.loadRooms(toload, function() {humanMsg.displayMsg('Sounds good');});
    },
    function(ses, err) {
      humanMsg.displayMsg('Sorry, error: ' + err.message);
    }
  );
}

function initDrag() {
  $('.draggable').draggable(
    {snap: true,snapMode: 'inner',revert: 'invalid',helper: 'clone',appendTo: "body",cursor: 'move'});
  $('td.v,td.ec,td.ei,td.ep,td.en').droppable({drop: function(a,b){
    var day= $(this).attr('data-day');
    var oid= $(b.draggable).attr('data-oid');
    var srid= $(b.draggable).attr('data-rid');
    var drid= $(this).parent().attr('data-rid');
    var x,y;
    x= $(this).offset().left;
    y= $(this).offset().top
    movingAction= {day: day, oid: oid, srid: srid, drid: drid};
    var occ= zakTableau.rooms[srid].getOccupancy(oid);
    $('#copy_customer').val(occ['customer']);
    $('#copy_nights').val(diffDateDays(occ['dfrom'], occ['dto']));
    $('#move_or_copy').modal({position:[y,x]});
    }
  });
}

function _menuOidRidXY(e) {
  oid= parseInt($(e).attr('data-oid'));
  rid= parseInt($(e).parent().attr('data-rid'));
  resid= parseInt($(e).attr('data-rid'));
  x= $(e).offset().left;
  y= $(e).offset().top;
  return {resid: resid, oid: oid, rid: rid, x: x, y: y};
}

function _menuDeleteOcc(a,e,p) {
  delReservationOid= parseInt($(e).attr('data-oid'));
  delReservationRid= parseInt($(e).parent().attr('data-rid'));
  console.log('Deletion required: rid= '+delReservationRid+', oid= '+ delReservationOid);
  $('#deleteOccupancy').modal();
  return;
}

function _menuEditOcc(a,e,p) {
  var editOccupancyOid= parseInt($(e).attr('data-oid'));
  var rid= parseInt($(e).attr('data-rid'));
  console.log('Editing Occupancy: ' + editOccupancyOid);
  localStorage.editOccupancyOid= editOccupancyOid;
  localStorage.editOccupancyRid= rid;
  console.log('Rid, oid: ' + rid + ',' + editOccupancyOid);
  goToSameDirPage('reservation');
}

function _menuResizeOcc(a,e,p) {
  var oid= parseInt($(e).attr('data-oid'));
  var rid= parseInt($(e).parent().attr('data-rid'));
  var occ= zakTableau.rooms[rid].getOccupancy(oid);
  var oclen= diffDateDays(occ['dfrom'], occ['dto']);
  try {
    $('#true_slider').slider('destroy');
  } catch(e) {};
  $('#slider').html('<div id="true_slider"></div>');
  $('#true_slider').slider({change: function(ev, ui) {
      $('#new_days').val(ui.value);
      }, range: 'min', min: 1, max: oclen + 10, step: 1, value: oclen});
  x= $(e).offset().left;
  y= $(e).offset().top;
  $('#actual_days').html('Actual days: ' + oclen);
  $('#new_days').val(oclen);
  $('#resize_rid').val(rid);
  $('#resize_oid').val(oid);
  $('#sliderdiv').modal({position: [y,x]});
}

function _menuPostpone(a,e,p) {
  var d= _menuOidRidXY(e);
  var oid= d['oid'];
  var rid= d['rid'];
  var x= d['x'];
  var y= d['y'];
  $('#postpone_rid').val(rid);
  $('#postpone_oid').val(oid);
  $('#postpone_div').modal({position: [y,x]});
}
function _menuStatus(a,e,p) {
  var d= _menuOidRidXY(e);
  var oid= d['oid'];
  var rid= d['resid'];
  var x= d['x'];
  var y= d['y'];
  var roomid= false;
  for (var rrid in zakTableau.rooms) {
    var occ= zakTableau.rooms[rrid].getOccupancy(oid);
    if (occ) {
      $('#cmbstatus_mod').val(occ.status);
      roomid= rrid;
      break
    }
  }
  $('#status_rid').val(rid);
  $('#status_rrid').val(roomid);
  $('#statusdiv').modal({position: [y,x]});
}

function updateReservationStatus() {
  var rid= $('#status_rid').val();
  var rrid= $('#status_rrid').val();
  var s= $('#cmbstatus_mod').val();
  console.log('Updating rstatus: ' + rid);
  llChangeReservationStatus(rid, s,
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
      /*window.location.reload(false);*/
      zakTableau.loadRooms([rrid], function() {humanMsg.displayMsg('Sounds good');});
      $.modal.close();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message, 1);
      $.modal.close();
    });
}

function postponeOccupancy() {
  var oid= $('#postpone_oid').val();
  var rid= $('#postpone_rid').val();
  var ndays= $('#postpone_days').val();
  $.modal.close();
  var occ= zakTableau.rooms[rid].getOccupancy(oid);
  var newdfrom= dateAddDays(occ['dfrom'], ndays);
  var newdto= dateAddDays(occ['dto'], ndays);

  llMoveOccupancy(oid, newdfrom, newdto, rid, 
    function(ses, recs) {
      if (!recs) {
        humanMsg.displayMsg('Not enough space for this reservation');
        return;
      }
      console.log(strDate(newdfrom));
      var toload= [rid];
      zakTableau.loadRooms(toload, function() {humanMsg.displayMsg('Sounds good');});
    },
    function(ses, err) {
      humanMsg.displayMsg('Sorry, error: ' + err.message);
    }
  );
}

function _sameMenu(a,e,p) {
  console.log('Menu action: ' + a);
  if (a == 'delete') 
    return _menuDeleteOcc(a,e,p);
  if (a == 'edit')
    return _menuEditOcc(a,e,p);
  if (a == 'resize')
    return _menuResizeOcc(a,e,p);
  if (a == 'postpone') 
    return _menuPostpone(a,e,p);
  if (a == 'status')
    return _menuStatus(a,e,p);
}

function initMenu() {
  $('td.menuv').contextMenu({menu: 'menuV'}, 
    function(a,e,p) {
      addNewReservationDay= parseInt($(e).attr('data-day'));
      addNewReservationRid= parseInt($(e).parent().attr('data-rid'));
      addNewReservation();
    }
  );
  $('td.menurc').contextMenu({menu: 'menuRes'}, function(a,e,p) {
    return _sameMenu(a,e,p);
  });
  $('td.menuri').contextMenu({menu: 'menuRes'}, function(a,e,p) {
    return _sameMenu(a,e,p);
  });
  $('td.menurn').contextMenu({menu: 'menuRes'}, function(a,e,p) {
    return _sameMenu(a,e,p);
  });
  $('td.menurp').contextMenu({menu: 'menuRes'}, function(a,e,p) {
    return _sameMenu(a,e,p);
  });
}

function changeOccupancyLenght() {
  var oid= $('#resize_oid').val();
  var rid= $('#resize_rid').val();
  var newlen= $('#new_days').val();
  $('#true_slider').slider('destroy');
  $.modal.close();
  var occ= zakTableau.rooms[rid].getOccupancy(oid);
  var oldlen= diffDateDays(occ['dfrom'], occ['dto']);
  if (oldlen == newlen) return;
  var udto= dateAddDays(occ['dfrom'], newlen);
  udto= unixDate(udto);
  llModOccupancy(oid, {dto: udto},
      function(ses, recs) {
        zakTableau.loadRooms([rid]);
      },
      function(ses, err) {
        humanMsg.displayMsg('Error: ' + err.message);
      });
}

function afterTableau() {
  initMenu();
  initDrag();
  if (!zakInitializedOnce) {
    humanMsg.displayMsg('Have a good work');
    zakInitializedOnce= true;
  }

  var tresids= [];
  var resids= [];
  var room, occ;
  for(var rid in zakTableau.rooms) {
    room= zakTableau.rooms[rid];
    for (var oid in room.occupancies) {
      occ= room.occupancies[oid];
      if ( tresids.indexOf(parseInt(occ['id_reservation'])) < 0 )
        tresids.push(occ['id_reservation']);
      else if ( resids.indexOf(parseInt(occ['id_reservation'])) < 0 )
          resids.push(occ['id_reservation']);
    }
  }

  var sresid, i;
  for(i=0;i<resids.length;i++) {
    sresid= resids[i];
    $('.rsrv_' + sresid).hoverIntent({
      sensitivity: 3,
      over: function(e) {
          var ct= e.currentTarget.className;
          var classes= ct.split(' ');
          var i;
          var resid= '';
          for(i=0;i<classes.length;i++) {
            if (classes[i].indexOf('rsrv_') == 0) {
              resid= classes[i].split('_')[1];
              break
            }
          }
          if (resid == '') return;
          $('.rsrv_' + resid).fadeTo(200, 0.4);
        },
      out: function(e) {
          var ct= e.currentTarget.className;
          var classes= ct.split(' ');
          var i;
          var resid= '';
          for(i=0;i<classes.length;i++) {
            if (classes[i].indexOf('rsrv_') == 0) {
              resid= classes[i].split('_')[1];
              break
            }
          }
          if (resid == '') return;
          $('.rsrv_' + resid).fadeTo(200, 1);
      }}
    );
  }

  var _f= function(r) {
    var rmrks= r.remarks || 'No remakrs';
    return '<div style="font-size:12px"><b>Remarks</b><br/>' + rmrks + '</div>';
  }

  var db= zakOpenDb();
  db.transaction(function(ses) {
    var strrids= tresids.join(',');
    var qry= 'select * from reservation where id in (' + strrids + ')';
    console.log(qry);
    ses.executeSql(qry, [], function(ses, recs) {
      for (var j= 0; j< recs.rows.length; j++) {
        var rsr= recs.rows.item(j);
        var rsrid= rsr.id;
        var cont= _f(rsr);
        console.log('qtip: ' + rsrid);
        $('td[data-rid="' + rsrid + '"]').qtip({show: {solo: true, effect: { type: 'fade' } }, style: {name: 'light', border: {color: '#bd0000', radius:5, width:2}}, content: cont, position: {corner: {target: 'topMiddle', tooltip: 'bottomMiddle'}}});
      }
      });
  });

}


function addNewReservation() {
  $('#addNewReservation').modal();
}

function _delOccupancy() {
  llDelOccupancy(delReservationOid, 
      function(ses, recs) {
        var room= zakTableau['rooms'][delReservationRid];
        room.delOccupancy(delReservationOid);
        zakTableau.designMe([delReservationRid]);
        $.modal.close();
      },
      function(ses, err) {
        humanMsg.displayMsg('Error: ' + err.message);
      }
    );
}

function initTableau(d, lendays, rids) {
  if (!d) {
    try {
      var dd= JSON.parse(localStorage.zakTableauDfrom);
      if (dd) {
        console.log('Overwriting date from lstorage');
        console.log(dd);
        d= dd;
      }
    } catch(e) {};
  }
  initDimensions();
  console.log(d);
  var dd= jsDate(d);
  console.log(dd);
  console.log('Initializing zak: ' + dd);
  zakTableau= new iTableau(dd, lendays, rids);
  zakTableau.afterDesign= function() {afterTableau()};
  zakTableau.loadRooms(false, function() {});
  $('#datepicker').val(strDate(d));
  if (d) 
    localStorage.zakTableauDfrom= JSON.stringify(unixDate(d));
  else
    localStorage.zakTableauDfrom= JSON.stringify('');
}

function goToTableauDate(d) {
  /*$('#tabtable').hide();*/
  console.log('Going to: ' + d);
  if (!d && dateIsToday(zakTableau.dfrom) == 0) return;
  try {
    if (d && unixDate(zakTableau.dfrom) == unixDate(d)) return;
  } catch(e) {};
  initTableau(d);
}

function prevDays() {
  var how= parseInt($('#prevDays').val());
  if (how == 0) return;
  var newdate= dateAddDays(zakTableau.dfrom, -how);
  $('#prevDays').val(0);
  goToTableauDate(newdate);
}
function nextDays() {
  var how= parseInt($('#nextDays').val());
  if (how == 0) return;
  var newdate= dateAddDays(zakTableau.dfrom, how);
  $('#nextDays').val(0);
  goToTableauDate(newdate);
}

$(document).ready(function() {
  
  initTableau(parseInt(localStorage.zakTableauDate) || '');
  $(function() {
    $("#datepicker").datepicker({showAnim: '', dateFormat: 'dd/mm/yy', onSelect: function(d,i) 
      {goToTableauDate(d);}
    });
  });
})

