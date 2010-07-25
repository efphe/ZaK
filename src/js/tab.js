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
  llNewOccupancy(getActiveProperty()['id'], false, sta, rid, sday, nights, cust,
    function(ses, recs) {
      if (!ses) {
        humanMsg.displayMsg('Not enough days space for this reservation', 1);
        return;
      }
      /*var iroom= zakTableau.rooms[rid];*/
      /*var oid= recs.insertId;*/
      /*console.log('Inserted Oid Occupancy: ' + oid);*/
      /*var dfrom= unixDate(sday);*/
      /*var dto= unixDate(dateAddDays(sday, nights));*/
      /*iroom.addOccupancy({id: oid, dfrom: dfrom, dto: dto, customer: cust, status: sta});*/
      /*console.log('Trying to desing ' + rid);*/
      /*zakTableau.designMe([rid]);*/
      zakTableau.loadRooms([rid]);
      $.modal.close();
      humanMsg.displayMsg('Welcome ' + cust);
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
  x= $(e).offset().left;
  y= $(e).offset().top;
  return {oid: oid, rid: rid, x: x, y: y};
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
  goToSameDirPage('book');
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
  $('#sliderdiv').modal({position: [y,x]});
  localStorage.resizeOccupancyOid= oid;
  localStorage.resizeOccupancyRid= rid;
}

function _menuPostpone(a,e,p) {
  var d= _menuOidRidXY(e);
  var oid= d['oid'];
  var rid= d['rid'];
  var x= d['x'];
  var y= d['y'];
  localStorage.postponeOccupancyOid= oid;
  localStorage.postponeOccupancyRid= rid;
  $('#postpone_div').modal({position: [y,x]});
}

function postponeOccupancy() {
  var oid= localStorage.postponeOccupancyOid;
  var rid= localStorage.postponeOccupancyRid;
  var ndays= $('#postpone_days').val();
  $.modal.close();
  var occ= zakTableau.rooms[rid].getOccupancy(oid);
  var newdfrom= dateAddDays(occ['dfrom'], ndays);
  var newdto= dateAddDays(occ['dto'], ndays);

  /*llModOccupancy(oid, {dfrom: unixDate(newdfrom), dto: unixDate(newdto)},*/
  /*function(ses, recs) {*/
  /*zakTableau.loadRooms([rid]);*/
  /*},*/
  /*function(ses, err) {*/
  /*humanMsg.displayMsg('Error: ' + err.message);*/
  /*});*/

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
}

function initMenu() {
  $('td.menuv').contextMenu({menu: 'menuV'}, 
    function(a,e,p) {
      addNewReservationDay= parseInt($(e).attr('data-day'));
      addNewReservationRid= parseInt($(e).parent().attr('data-rid'));
      addNewReservation();
    }
  );
  $('td.menurc').contextMenu({menu: 'menuRc'}, function(a,e,p) {
    return _sameMenu(a,e,p);
  });
  $('td.menuri').contextMenu({menu: 'menuRi'}, function(a,e,p) {
    return _sameMenu(a,e,p);
  });
  $('td.menurn').contextMenu({menu: 'menuRi'}, function(a,e,p) {
    return _sameMenu(a,e,p);
  });
  $('td.menurp').contextMenu({menu: 'menuRi'}, function(a,e,p) {
    return _sameMenu(a,e,p);
  });
}

function changeOccupancyLenght() {
  var oid= localStorage.resizeOccupancyOid;
  var rid= localStorage.resizeOccupancyRid;
  var newlen= $('#new_days').val();
  console.log('Destroying slider...');
  $('#true_slider').slider('destroy');
  $.modal.close();
  console.log('Destroying modal...');
  var occ= zakTableau.rooms[rid].getOccupancy(oid);
  if (diffDateDays(occ['dfrom'], occ['dto']) == newlen)
    return;
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

  var tresids= new Array();
  var resids= new Array();
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
              resid= classes[i][5];
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
              resid= classes[i][5];
              break
            }
          }
          if (resid == '') return;
          $('.rsrv_' + resid).fadeTo(200, 1);
      }}
    );
  }
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
  initDimensions();
  console.log(d);
  var dd= jsDate(d);
  console.log(dd);
  console.log('Initializing zak: ' + dd);
  zakTableau= new iTableau(dd, lendays, rids);
  zakTableau.afterDesign= function() {afterTableau()};
  zakTableau.loadRooms(false, function() {});
  $('#datepicker').val(strDate(d));
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
  initTableau();
  $(function() {
    $("#datepicker").datepicker({showAnim: '', dateFormat: 'dd/mm/yy', onSelect: function(d,i) 
      {goToTableauDate(d);}
    });
  });
})
