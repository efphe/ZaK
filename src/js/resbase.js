zakReservation= false;
zakTableau= false;
roomPricing= false;

occupancyObject= {
  adults: 1,
  children: []
}
_occupancyObject= copyObject(occupancyObject);

var iReservation= function(reservation, invoice) {
  this.invoiceReservation= invoice;
  this.reservation= reservation;
  this.extras= reservation.extras;
  this.occupancies= reservation['occupancies'];
  this.activeOccupancy= localStorage.editOccupancyOid;
  this.roomSetups= new Array();

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
    var i,j, rres= new Array();
    for (j in zakTableau.rooms) {
      var room= zakTableau.rooms[j];
      var res= new Array();
      res.push(room['id']);
      for (i=0;i<zakTableau.lendays - 1;i++) 
        res.push(0.0);
      rres.push(res)
    }
    return rres;
  }

  this ['_getRPrices']= function() {
    /* return saved prices or default prices */
    try {
      evprices= JSON.parse(zakReservation.reservation.custom_pricing);
      if (!evprices) evprices= zakReservation.stupid_pricing();
    } catch(e) {evprices= zakReservation.stupid_pricing();};
    return evprices;
  }


  this['designReadyPrices']= function() {
    var rlist= roomPricing;
    var rlen= rlist[0].length;
    var res= '<thead class="pricing"><tr><th>Day</th>';
    var room;
    for(j=0;j<rlist.length;j++) {
      room= zakTableau.rooms[rlist[j][0]];
      res+= '<th>' + room.name + '</th>';
    }

    function _strDay(dayidx) {
      var d= unixDate(zakTableau.dfrom) + (86400 * parseInt(dayidx - 1));
      return  strDate(d, 'd/m');
    }

    res+= '</tr></thead>';
    for(i=1;i<rlen;i++) {
      res+= '<tr><td>' + _strDay(i) + '</td>';
      for(j=0;j<rlist.length;j++) {
        var rid= rlist[j][0];
        if (!zakReservation.invoiceReservation)
          res+= '<td><input onchange="computeRoomSum(' + j + ')" class="col_index_' + j + '" id="rprice_' + rid + '_' + i + '" type="text" value="' + rlist[j][i] + '"></input></td>';
        else
          res+= '<td>' + rlist[j][i] + '</td>';
      }
      res+= '</tr>';
    }
    var lastrow= '';
    totcount= 0.0;
    for(j=0;j<rlist.length;j++) {
      count= 0.0;
      for(i=1;i<rlen;i++) 
        count+= parseFloat(rlist[j][i]);
      lastrow+= '<td class="col_total col_total_' + j + '">' + count.toFixed(2) + '</td>';
      totcount+= count;
    }
    lastrow= '<tr><td><b id="rtotal">' + totcount.toFixed(2) + '</b></td>' + lastrow + '</tr>';
    res+= lastrow;
    $('#tablepricing').html(res);
  }

  /* requires zakTableau!!! */
  this['_designPrices']= function(evprices) {
    if(!evprices) {
      /*console.log('There is no saved prices');*/
      evprices= zakReservation._getRPrices();
      roomPricing= evprices;
      zakReservation.designReadyPrices();
      return;
    }
    var occs= zakReservation.occupancies, i, j;
    var rlist= [];
    var treatment= $('#cmbmeal').val();
    for(i=0;i<occs.length;i++) {
      var occ= occs[i];
      var occn= 0;
      var newar= new Array();
      var people= zakReservation.getOccupancyPeople(occ['id']);
      occn+= parseFloat(people.adults);
      for (j=0;j<people.children.length;j++) {
        var chi= people.children[j];
        occn+= parseFloat( (100.0 - parseFloat(chi['red'])) / parseFloat(100.0));
      }
      var room= zakReservation.roomFromOcc(occ);
      newar.push(room.id);
      var k= 'price_' + treatment,p;
      for (j=0;j<evprices.length;j++) {
        p= parseFloat(evprices[j][k]);
        if (!p) p= 0.0;
        var pp= p * parseFloat(occn);
        newar.push(pp.toFixed(2));
      }
      rlist.push(newar);
    }
    roomPricing= rlist;
    zakReservation.designReadyPrices();
  }
  this['designPrices']= function(prid) {
    if (!prid) 
      return zakReservation._designPrices();
    var dfrom= zakTableau.dfrom;
    var dto= dateAddDays(dfrom, zakTableau.lendays - 1);
    llGetDatedPricing(prid, dfrom, dto, true, zakReservation._designPrices);
  }

  this['loadTableau']= function(cb) {
    var dfrom= false;
    var dto= false;
    var i= 0, occ;
    var rids= new Array();
    for(i=0;i<this['occupancies'].length;i++) {
      occ= this['occupancies'][i];
      if (!dfrom || parseInt(occ['dfrom']) < parseInt(dfrom)) dfrom= occ['dfrom'];
      if (!dto || parseInt(occ['dto']) > parseInt(dto)) dto= occ['dto'];
      rids.push(occ['id_room']);
    }
    var zlen= diffDateDays(dfrom, dto) + 1;
    zakTableau= new iTableau(dfrom, zlen, rids);
    zakTableau.loadRooms(rids, cb);
  }

  this['designMe']= function() {
    this.loadTableau(zakReservation.initPage);
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
    zakReservation.getRoomSetups(
      function() {
        $('#selectSetup').html(zakReservation.selectRoomSetups(rsid));
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
        humanMsg.displayMsg('Error loading pricing: ' + err.message, 1);
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
    /*console.log(rid);*/
      room= zakTableau.rooms[rid];
      /*console.log('Now '+ room['id']);*/
      if (rid == localStorage.editOccupancyRid) sel= 'selected="selected"';
      else sel= '';
      hh+= '<option '+sel+' value="'+rid+'">'+room['name']+'</option>';
    }
    /*console.log('HH: '+ hh);*/
    $('#selRoomSetup').empty().append(hh);
    zakReservation.designOccupancy();
    zakReservation.designExtras();
    zakReservation.desingPagePrices();
  }

  this['_designExtras']= function(extras) {
    var i, res= '', e;
    for (i=0;i<extras.length;i++) {
      e= extras[i];
      res+= '<option value="' + e['id'] + '">' + e['name'] + '</option>';
    }
    $('#selectExtra').empty().append(res);
  }

  this['_designAssignedExtras']= function() {
    /*console.log('Designing assignedExtra');*/
    if (!zakReservation.extras) {
      $('#assignedExtras').html('');
      return;
    }
    var extras= JSON.parse(zakReservation.extras);
    var res= '<table class="assignedExtras">', e;
    for (i=0;i<extras.length;i++) {
      e= extras[i];
      res+= '<tr><td><b id="extra_id_' + e['id'] +'">' + e['name'] + '</b>:</td>'; 
      res+= '<td><input class="extraHow" type="text" id="extra_how_' + e['id'] + '" value="' + e['how'] + '"></input></td>'; 
      res+= '<td><input class="extraCost" type="text" id="extra_cost_' + e['id'] + '" value="' + parseFloat(e['cost']).toFixed(2) + '"></input></td>'; 
      /*res+= '<td>' + (parseFloat(e['cost']) * parseFloat(e['how'])).toFixed(2) + '</td>';*/
      res+= '<td><a href="javascript:removeAssignedExtra(' + e['id'] + ')"><b>Delete</b></a></td>';
      res+= '</tr>';
    }
    res+= '<tr><td colspan="4" style="text-align:center"><input type="submit" value="Update extras" onclick="saveUpdatedExtras()"></input></td></tr></table>';
    $('#assignedExtras').html(res);
  }

  this['designExtras']= function() {
    llLoadExtras(
      function(ses, recs) {
        zakReservation._designExtras(arrayFromRecords(recs));
        zakReservation._designAssignedExtras();
      },
      function(ses, err) {
        humanMsg.displayMsg('Error loading extras: ' + err.message, 1);
      });
  }

  return this;
}
