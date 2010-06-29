zakReservation= false;
zakTableau= false;
zakExtras= -1;
roomPricing= false;

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

  this ['roomFromOcc']= function(occ) {
    return zakTableau.rooms[occ['id_room']];
  }

  this ['roomNameFromOcc']= function(occ) {
    return zakReservation.roomFromOcc(occ).name;
  }

  this['stupid_pricing']= function() {
    var newp= {price_ro: '', price_bb: '', price_hb: '', price_fb: ''};
    var res= new Array(), i;
    for (i=0;i<zakTableau.lendays;i++) {
      res.push(newp);
    }
    return res;
  }

  this ['_getRPrices']= function() {
    try {
      evprices= JSON.parse(zakReservation.reservation.custom_pricing);
      if (!evprices) evprices= zakReservation.stupid_pricing();
    } catch(e) {evprices= zakReservation.stupid_pricing();};
    return evprices;
  }

  /* requires zakTableau!!! */
  this['_designPrices']= function(evprices) {
    if(!evprices) 
      evprices= zakReservation._getRPrices();
    var occs= zakReservation.occupancies, i, j;
    var rlist= [];
    for(i=0;i<occs.length;i++) {
      var occ= occs[i];
      var treatment= occ['treatment'] || 'ro';
      var occn= 0;
      var newar= new Array();
      var people= zakReservation.getOccupancyPeople(occ['id']);
      var rlen= false;
      occn+= people.adults;
      for (j=0;j<people.children.length;j++) {
        var chi= people.children[j];
        occn+= parseFloat(chi['red']) / parseFloat(100.0);
      }
      var room= zakReservation.roomFromOcc(occ);
      newar.push(room);
      var k= 'price_' + treatment,p;
      for (j=0;j<evprices.length;j++) {
        p= parseFloat(evprices[j][k]);
        if (!p) p= 0.0;
        var pp= p * parseFloat(occn);
        newar.push(pp.toFixed(2));
      }
      rlist.push(newar);
      if (!rlen) rlen= newar.length;
    }
    roomPricing= rlist;
    zakReservation.designReadyPrices();
  }

  this['designReadyPrices']= function() {
    var rlist= roomPricing;
    var rlen= rlist[0].length;
    var res= '<tr>';
    for(j=0;j<rlist.length;j++) {
      res+= '<td>' + rlist[j][0].name + '</td>';
    }
    res+= '</tr>';
    for(i=1;i<rlen;i++) {
      res+= '<tr>';
      for(j=0;j<rlist.length;j++) {
        res+= '<td>' + rlist[j][i] + '</td>';
      }
      res+= '</tr>';
    }
    $('#tablepricing').html(res);
  }

  this['designPrices']= function() {
    var resprices= zakReservation.reservation.custom_pricing;
    if (resprices) return zakReservation._designPrices();
    var prid= $('#cmbpricing').val();
    if (prid == 0) return zakReservation._designPrices();
    var dfrom= zakReservation.reservation.dfrom;
    var dto= zakReservation.reservation.dto;
    llGetDatedPricing(prid, dfrom, dto, zakReservation._designPrices);
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

  this['getOccupancyPeople']= function(oid) {
    var occ= zakReservation.getOccupancy(oid || zakReservation.activeOccupancy);
    var people, i,children, child, age, red, res;
    try {
      people= JSON.parse(occ['occupancy']);
      if (!people) people= copyObject(_occupancyObject);
    } catch(e) {people= copyObject(_occupancyObject);};
    return people;
  }

  this['designOccupancyPeople']= function(oid) {
    var p= zakReservation.getOccupancyPeople(oid);
    occupancyObject= p;
    designAdultsChildren(1);
  }

  this['designOccupancy']= function(oid) {
    if (oid) zakReservation.activeOccupancy= oid;
    else oid= zakReservation.activeOccupancy;
    zakReservation.designRoomSetup(oid);
    zakReservation.designOccupancyPeople(oid);
  }

  this['desingPagePrices']= function() {
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
    zakReservation.desingPagePrices();
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
