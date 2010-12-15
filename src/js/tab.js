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
    humanMsg.displayMsg(_('Specify a valid customer'), 1);
    return;
  }
  var nights= $('#addNewReservationNights').val();
  if (parseInt(nights) != nights) {
    humanMsg.displayMsg(_('Specify a valid number of nights'), 1);
    return;
  }
  var sta= $('#addNewReservationStatus').val();
  if (parseInt(sta) != sta || ! ZAK_MAP_STATUS[parseInt(sta)]) {
    humanMsg.displayMsg(_('Specify a valid reservation status'), 1);
    return;
  }
  var rid= addNewReservationRid;
  var sday= dateAddDays(zakTableau.dfrom, addNewReservationDay);
  llNewOccupancy(getActiveProperty()['id'], false, sta, rid, sday, nights, cust, false,
    function(ses, recs) {
      if (!ses) {
        humanMsg.displayMsg(_('Not enough free days for this reservation/room'), 1);
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
            humanMsg.displayMsg(_('Welcome')+' ' + cust);
          });
      }
      else {
        zakTableau.loadRooms([rid]);
        $.modal.close();
        humanMsg.displayMsg(_('Welcome')+' ' + cust);
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

  if (srid == drid) {
    humanMsg.displayMsg(_('You can\'t add a new occupancy on the same room'), 1);
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
        humanMsg.displayMsg(_('Not enough free days for this reservation/room'), 1);
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

  var room= zakTableau.rooms[srid];
  var occ= room.getOccupancy(oid);
  var udfrom= dateAddDays(zakTableau.dfrom, day);
  var udto= dateAddDays(udfrom, diffDateDays(occ['dfrom'], occ['dto']));

  llMoveOccupancy(oid, udfrom, udto, drid, 
    function(ses, recs) {
      if (!recs) {
        humanMsg.displayMsg(_('Not enough free days for this reservation/room'), 1);
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
  $('#deleteOccupancy').modal();
  return;
}

function _menuEditOcc(a,e,p) {
  var editOccupancyOid= parseInt($(e).attr('data-oid'));
  var rid= parseInt($(e).attr('data-rid'));
  localStorage.editOccupancyOid= editOccupancyOid;
  localStorage.editOccupancyRid= rid;
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
        humanMsg.displayMsg(_('Not enough free days for this reservation/room'), 1);
        return;
      }
      var toload= [rid];
      zakTableau.loadRooms(toload, function() {humanMsg.displayMsg('Sounds good');});
    },
    function(ses, err) {
      humanMsg.displayMsg('Sorry, error: ' + err.message);
    }
  );
}

function _sameMenu(a,e,p) {
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
  var rsrmap= {};
  for(var rid in zakTableau.rooms) {
    room= zakTableau.rooms[rid];
    for (var oid in room.occupancies) {
      occ= room.occupancies[oid];
      var resid= occ['id_reservation'];
      if (!rsrmap[resid]) rsrmap[resid]= [occ];
      else rsrmap[resid].push(occ);
      if ( tresids.indexOf(parseInt(resid)) < 0 )
        tresids.push(resid);
      else if ( resids.indexOf(parseInt(resid)) < 0 )
        resids.push(resid);
    }
  }

  var db= zakOpenDb();
  db.transaction(function(ses) {
    var strrids= tresids.join(',');
    var qry= 'select * from reservation where id in (' + strrids + ')';
    ses.executeSql(qry, [], function(ses, recs) {
      for (var j= 0; j< recs.rows.length; j++) {
        var rsr= recs.rows.item(j);
        tabRsrvPreview(ses, rsr);
      }
      });
  });

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
        d= dd;
      }
    } catch(e) {};
  }
  initDimensions();
  var dd= jsDate(d);
  try {
    lrids= JSON.parse(localStorage.zkTabRids);
  } catch (e) {lrids= false};
  zakTableau= new iTableau(dd, lendays, rids || lrids);
  zakTableau.afterDesign= function() {afterTableau()};
  zakTableau.loadRooms(rids, function() {});
  $('#datepicker').val(strDate(d));
  if (d) 
    localStorage.zakTableauDfrom= JSON.stringify(unixDate(d));
  else
    localStorage.zakTableauDfrom= JSON.stringify('');
}

function goToTableauDate(d) {
  /*$('#tabtable').hide();*/
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

function tabRsrvPreview(ses, rsrv) {
  var rid= rsrv.id;
  ses.executeSql('select occupancy.*,room_setup.name as rsname, room.code roname from occupancy left join room_setup on occupancy.id_room_setup = room_setup.id join room on occupancy.id_room= room.id where occupancy.id_reservation = ?', [rid],
    function(ses, recs) {
      var amount= 0.0;
      try {
        var prices= JSON.parse(rsrv.custom_pricing);
      } catch(e) {
        var prices= {};
      }
      for (var rkey in prices) {
        var sprices= prices[rkey];
        for (var jj= 0; jj< sprices.length; jj++) {
          amount+= parseFloat(sprices[jj]);
        }
      }
      var eamount= 0.0;
      try {
        var rextras= JSON.parse(rsrv.extras);
      } catch(e) {
        var rextras= [];
      }
      for (var jj= 0; jj< rextras.length; jj++) {
        var e= rextras[jj];
        eamount+= parseFloat(e.cost);
      }
      var mamount= 0.0;
      try {
        var rmeals= JSON.parse(rsrv.meals);
      } catch(e) {
        var rmeals= {};
      }
      for (var mealday in rmeals) {
        var mm= rmeals[mealday];
        for (var jj= 0; jj< mm.length; jj++) {
          mamount+= parseFloat(mm[jj].cprice);
        }
      }
      var res= '<div style="font-size:12px">';
      res+= '<b>' + rsrv.customer + '</b><br/>'; 
      res+= amount.toFixed(2) + ' ' + getCurrency();
      res+= ', ' + eamount.toFixed(2) + ' ' + getCurrency();
      res+= ', ' + mamount.toFixed(2) + ' ' + getCurrency();
      res+= '<br/>';
      res+= '<table style="font-size:12px;margin-left:10px"><tr><td colspan="2" align="center" style="color:gray">'+_('Rooms setup')+'</td></tr>';
      for (var j= 0; j<recs.rows.length;j++) {
        var occ= recs.rows.item(j);
        res+= '<tr><td><b>' + occ.roname + '</b></td><td>' + (occ.rsname || _('Unknown setup')) + '</td></tr>';
      }
      res+= '</table>';
      if (rsrv.remarks)
        res+= '<br/><b>'+('Remarks')+':</b>' + rsrv.remarks;
      res+= '</div>';
      $('td[data-rid="' + rid + '"]').qtip({show: {solo: true, effect: { type: 'fade' } }, style: {name: 'light', border: {color: '#570000', radius:5, width:2}}, content: res, position: {corner: {target: 'topMiddle', tooltip: 'bottomMiddle'}}});
    },
    function(ses, err) {
  });
}

function selectedRoomTag() {
  var v= $(this).val();
  if (v == '--') {
    localStorage.zkTabRids= '';
    $('#tabtable').html('<tr id="tabtableheader"></tr>');
    initTableau(zakTableau.dfrom, zakTableau.lendays);
    return;
  }
  localStorage.zkActualTag= v;
  var db= zakOpenDb();
  var q= "select id from room where tags like('%," + v + ",%') or tags = '"+v+"' or tags like('"+v+",%') or tags like('%,"+v+"')";
  db.transaction(function(ses) {
    ses.executeSql(q, [],
    function(ses, recs) {
      var rids= [];
      for (var i= 0; i< recs.rows.length;i++) {
        var rid= recs.rows.item(i).id;
        if (rids.indexOf(rid) == -1) rids.push(rid);
      }
      $('#tabtable').html('<tr id="tabtableheader"></tr>');
      localStorage.zkTabRids= JSON.stringify(rids);
      initTableau(zakTableau.dfrom, zakTableau.lendays);
    }, 
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message, 1);
    });
  });
}

function initializeTtags() {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('select tags from room where id_property = ?', [getActiveProperty()['id']], 
      function(ses, recs) {
        var actualtag= localStorage.zkActualTag || '--';
        var tags= [];
        if (!actualtag)
          var res= '<option value="--">--</option>';
        else
          var res= '<option selected="selected" value="--">--</option>';
        for (var i= 0; i< recs.rows.length; i++) {
          var rtags= recs.rows.item(i).tags;
          if (!rtags) continue;
          rtags= rtags.split(',');
          for (var j=0; j< rtags.length; j++) {
            var t= rtags[j];
            if (tags.indexOf(t) >= 0) continue;
            tags.push(t);
            if (actualtag == t) 
              res+= '<option selected="selected" value="' + t + '">'+t+'</option>';
            else
              res+= '<option value="' + t + '">'+t+'</option>';
          }
        }
        $('#ttags').html(res).change(selectedRoomTag);
      }, function(ses, err) {console.log('Error ttags: '+ err.message)});
  });
}

$(document).ready(function() {
  initializeTtags();
  initTableau(parseInt(localStorage.zakTableauDate) || '');
  $(function() {
    $("#datepicker").datepicker({showAnim: '', dateFormat: 'dd/mm/yy', onSelect: function(d,i) 
      {goToTableauDate(d);}
    });
  });
})

