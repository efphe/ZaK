zakReservation= false;
zakTableau= false;
zakExtras= -1;

occupancyObject= {
  adults: 1,
  children: []
}
_occupancyObject= copyObject(occupancyObject);

var iReservation= function(reservation) {
  this.reservation= reservation;
  this.occupancies= reservation['occupancies'];
  this.activeOccupancy= localStorage.editOccupancyOid;
  this.roomSetups= new Array();
  this.extras= new Array();

  this['getOccupancy']= function(oid) {
    var i= 0;
    for (i=0;i<zakReservation.occupancies.length;i++) {
      if (zakReservation.occupancies[i]['id'] == oid)
        return zakReservation.occupancies[i];
    }
  }

  this['_hierPricing']= function() {
    var room, oid, i, occ, rname;
    var rlist= {};
    for (i=0;i<zakReservation.occupancies.length;i++) {
      occ= zakReservation.occupancies[i];
      oid= occ['id'];
      var odfrom= occ['dfrom'];
      var odto= occ['dto'];
      var cdfrom= zakTableau.dfrom;
      var rl= new Array();
      while(1) {
        if (cdfrom > odto) break;
        if (cdfrom < odfrom) {
          cdfrom+= 86400;
          rl.push(false);
          continue;
        }
        var idx= diffDateDays(zakTableau.dfrom, cdfrom);
        rl.push(true);
        cdfrom+= 86400;
      }
      while(rl.length < zakTableau.lendays)
        rl.push(false);
      rlist[oid]= rl;
    }
    console.log(rlist);
    return rlist;
  }

  this['designPrices']= function() {
    var hp= zakReservation._hierPricing();
    var rid, room;
    var rlist= {};
    var rpid= zakReservation.reservation['id_pricing'];
    for (var oid in hp) {
      rid= zakTableau.getOccupancy(oid)['id_room'];
      room= zakTableau.rooms[rid];
    }
    if (!rpid) return zakReservation._trivialPricing();
  }

  this['designMe']= function() {
    var dfrom= false;
    var dto= false;
    var occ= false;
    var rids= new Array();
    var i= 0;
    for(i=0;i<this['occupancies'].length;i++) {
      occ= this['occupancies'][i];
      if (!dfrom || parseInt(occ['dfrom']) < parseInt(dfrom)) dfrom= occ['dfrom'];
      if (!dto || parseInt(occ['dto']) > parseInt(dto)) dto= occ['dto'];
      rids.push(occ['id_room']);
    }
    var zlen= diffDateDays(dfrom, dto) + 1;
    zakTableau= new iTableau(dfrom, zlen, rids);
    llLoadPricing(
      function(ses, recs) {
        var i,p,res= '', rpid= zakReservation.reservation['id_pricing'];
        for (i=0;i<recs.rows.length;i++) {
          p= recs.rows.item(i); 
          if (p['id'] == rpid) 
            res+= '<option selected="selected" value="' + rpid + '">' + p['name'] + '</option>';
          else
            res+= '<option value="' +p['id'] + '">' + p['name'] + '</option>';
        }
        if (!rpid)
          res+= '<option selected="selected" value="0">--</option>';
        $('#cmbpricing').empty().html(res);
        zakReservation.designPrices();
      },
      function(ses, err) {
        humanMsg.displayMsg('Error loading pricing: ' + err.message);
      });
    zakTableau.loadRooms(rids, function(){zakReservation.initPage()});
  }

  this['selectRoomSetups']= function(rsid) {
    var i= 0, rstp, res= '', sel;
    for(i=0;i<zakReservation.roomSetups.length;i++) {
      rstp= zakReservation.roomSetups[i];
      if (parseInt(rstp['id']) == parseInt(rsid)) 
        sel= ' selected="selected" ';
      else
        sel= '';
      res+= '<option ' + sel + 'value="'+rstp['id']+'">'+rstp['name']+'</option>';
    }
    if (!rsid) res+= '<option value="" selected="selected">--</option>';
    return res;
  }

  this['getRoomSetups']= function(cbs, cbe) {
    llLoadRoomSetups(
      function(ses, recs) {
        var i=0;
        for(i=0;i<recs.rows.length;i++) {
          zakReservation.roomSetups.push(recs.rows.item(i));
        }
        cbs();
      },
      function (ses, err) {
        cbe(ses, err);
      });
  }

  this['designRoomSetup']= function(oid) {
    var occ, rsid;
    occ= zakReservation.getOccupancy(oid || zakReservation.activeOccupancy);
    rsid= occ['id_room_setup'];
    if (zakReservation.roomSetups.length > 0) {
      $('#selectSetup').html(zakReservation.selectRoomSetups(rsid));
      $('#roomSetupRemarks').val(occ['remarks'] || '');
    } else zakReservation.getRoomSetups(
      function() {
        console.log('After loading');
        $('#selectSetup').html(zakReservation.selectRoomSetups(rsid));
        console.log('Now remarks');
        $('#roomSetupRemarks').val(occ['remarks'] || '');
      },
      function(ses, err) {
        humanMsg.displayMsg('Error loading occupancy: ' + err.message, 1);
      });
  }

  this['designOccupancyPeople']= function(oid) {
    var occ= zakReservation.getOccupancy(oid || zakReservation.activeOccupancy);
    var people, i,children, child, age, red, res;
    try {
      people= JSON.parse(occ['occupancy']);
      occupancyObject= people;
    } catch(e) {occupancyObject= _occupancyObject;};
    designAdultsChildren(1);
  }

  this['designOccupancy']= function(oid) {
    if (oid) zakReservation.activeOccupancy= oid;
    else oid= zakReservation.activeOccupancy;
    zakReservation.designRoomSetup(oid);
    zakReservation.designOccupancyPeople(oid);
  }

  this['initPage']= function() {
    var resid= zakReservation.reservation.id;
    var rescu= zakReservation.reservation.customer;
    $('#reservationTitle').append('Reservation ' + resid + ' (' + rescu + ')');
    $('#rremarks').val(zakReservation.reservation.remarks || '');

    var room= false;
    var hh= '';
    var sel= '';
    for (var rid in zakTableau.rooms) {
      console.log(rid);
      room= zakTableau.rooms[rid];
      console.log('Now '+ room['id']);
      if (rid == localStorage.editOccupancyRid) sel= 'selected="selected"';
      else sel= '';
      hh+= '<option '+sel+' value="'+rid+'">'+room['name']+'</option>';
    }
    console.log('HH: '+ hh);
    $('#selRoomSetup').empty().append(hh);
    zakReservation.designOccupancy();
    zakReservation.designExtras();
  }

  this['_designExtras']= function() {
    var i, res= '', e;
    for (i=0;i<zakExtras.length;i++) {
      e= zakExtras[i];
      res+= '<option value="' + e['id'] + '">' + e['name'] + '</option>';
    }
    $('#selectExtra').empty().append(res);
  }

  this['designExtras']= function() {
    if(zakExtras!= -1) {
      zakReservation._designExtras();
      return;
    }
    llLoadExtras(
      function(ses, recs) {
        var extras= new Array(), i;
        for(i=0;i<recs.rows.length;i++) {
          extras.push(recs.rows.item(i));
        }
        zakExtras= extras;
        zakReservation._designExtras();
      },
      function(ses, err) {
        humanMsg.displayMsg('Error loading extras: ' + err.message);
      });
  }

  return this;
}

function changeOccupancy() {
  var rid= $('#selRoomSetup').val();
  var i, occ;
  for(i=0;i<zakReservation.occupancies.length;i++) {
    occ= zakReservation.occupancies[i];
    if (occ['id_room'] == rid && occ['id'] != zakReservation.activeOccupancy) 
      zakReservation.designOccupancy(occ['id']);
  }
}

function _childrenHtml(age, red) {
  var el= '<tr class="children_c"><td>Child</td><td>Age: ' + age + ' (-' + red + '%)</td>';
  el+= '<td><b><a href="javascript:delChild(' + age +','+red + ')">Delete</a></b></td></tr>'; 
  return el;
}

function designAdultsChildren(putAdults) {
  console.log('Designing occupancy');
  var i, chi, res= '', age, red;
  for (i=0;i<occupancyObject.children.length;i++) {
    chi= occupancyObject.children[i];
    age= chi['age'];
    red= chi['red'];
    res+= _childrenHtml(age, red);
  }
  if (putAdults)
    $('#adults').val(occupancyObject['adults']);
  $('#childrenCounter').val(occupancyObject.children.length);
  $('tr.children_c').remove();
  $('#table_occupancy').append(res);
}

function addChildren() {
  var age= $('#children_age').val();
  var red= $('#children_red').val();
  if (parseInt(age) != age || parseInt(red) != red) {
    humanMsg.displayMsg('Please, specify good values', 1);
    return;
  }
  occupancyObject.children.push({age: age, red: red});
  designAdultsChildren();
  $.modal.close();
}

function delChild(age, red) {
  var i, child;
  for(i=0;i<occupancyObject.children.length;i++) {
    child= occupancyObject.children[i];
    if (child['age'] == age && red == child['red']) {
      occupancyObject.children.splice(i,1);
    }
  }
  designAdultsChildren();
}

function askChildren() {
  var el= $('#addChildrenButton');
  var x= el.offset().left;
  var y= el.offset().top;
  $('#children_div').modal({position: [y,x]});
}

function saveOccupancy() {
  var ads, newd;
  ads= $('#adults').val();
  newd= {adults: ads, children: occupancyObject.children};
  llModOccupancy(zakReservation.activeOccupancy, {occupancy: JSON.stringify(newd)},
    function(cbs, recs) {
      llGetReservationFromOid(zakReservation.activeOccupancy,
        function(reservatioin) {
          zakReservation.occupancies= reservatioin['occupancies'];
          occupancyObject= false;
          zakReservation.designOccupancyPeople();
          humanMsg.displayMsg('Sounds good');
        });
    },
    function(cbs, err) {
      humanMsg.displayMsg('Error: ' + err.message, 1);
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
  llAddRSetup(rsname, 
    function(ses, recs) {
      rsid= recs.insertId;
      zakReservation.roomSetups.push({name: rsname, id: rsid});
      zakReservation.designRoomSetup();
      $.modal.close();
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message);
    });
}

function saveRSetup() {
  var rsid= $('#selectSetup').val();
  var remarks= $('#roomSetupRemarks').val();
  console.log('Updating occ: rsid: ' + rsid + ', remarks: ' + remarks);
  llModOccupancy(zakReservation.activeOccupancy, {remarks: remarks, id_room_setup: rsid},
    function(ses, recs) {
      console.log('reloading occupancies');
      llGetReservationFromOid(zakReservation.activeOccupancy,
        function(reservatioin) {
          console.log('Dio cane');
          zakReservation.occupancies= reservatioin['occupancies'];
          zakReservation.designOccupancy();
          humanMsg.displayMsg('Sounds good');
        },
        function(ses, err) {
          humanMsg.displayMsg('Error: ' + err.message, 1);
        });
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message, 1);
    });
}

function saveRemarks() {
  var remarks= $('#rremarks').val();
  llModReservation(zakReservation.reservation.id, {remarks: remarks},
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message, 1);
    });
}

function askExtra() {
  var el= $('#addExtraButton');
  var x= el.offset().left;
  var y= el.offset().top;
  $('#addextra_div').modal({position: [y,x]});
}

function addExtra() {
  var ename= $('#extra_name').val();
  var ecost= $('#extra_cost').val();
  if (!checkFloat(ecost) || ! ename) {
    humanMsg.displayMsg('Please, specify good values', 1);
    return;
  }
  llAddExtra(ename, ecost,
    function(ses, recs) {
      var eid= recs.insertId;
      zakExtras.push({name: ename, cost: ecost});
      zakReservation._designExtras();
      $.modal.close();
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message);
    });
}

function initReservation() {
  if (!localStorage.editOccupancyOid) {
    goToAdminPage('tableau');
    return;
  }
  console.log('Initializing occupancy: '+ localStorage.editOccupancyOid);
  llGetReservationFromOid(localStorage.editOccupancyOid,
    function(reservation) {
      zakReservation= new iReservation(reservation);
      zakReservation.designMe();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: '+ err.message, 1);
    });
}
$(document).ready(function() {
  initReservation();
});
