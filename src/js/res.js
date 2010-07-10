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

function computeRoomSum(j) {
  var count= 0.0;
  var ocount= parseFloat($('td.col_total_' + j).html());
  $('input.col_index_' + j).each(function(n, el) {
    var v= $(el).val();
    if (!checkFloat(v)) {
      humanMsg.displayMsg('Please, specify correct prices');
      return;
    }
    count+= parseFloat(v);
  });
  $('#restorePrices').show();
  $('#storePricesButton').show();
  $('td.col_total_' + j).each(function(n, el) {
    $(el).html(count.toFixed(2));
  });
  var diff= parseFloat(count) - parseFloat(ocount);
  var newcount= parseFloat($('#rtotal').html()) + diff;
  $('#rtotal').html(newcount.toFixed(2));
}

function recomputePrices() {
  $('#restorePrices').hide();
  $('#storePricesButton').hide();
  zakReservation.designPrices();
}

function changePricing() {
  var pidr= $('#cmbpricing').val();
  zakReservation.designPrices(pidr);
  $('#restorePrices').show();
  $('#storePricesButton').show();
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
      var rsid= recs.insertId;
      saveRSetup(rsid);
      $.modal.close();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message, 1);
    });
}

function saveRSetup(rsid, remarks) {
  var rsid= rsid || $('#selectSetup').val();
  var remarks= remarks || $('#roomSetupRemarks').val();
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

function removeAssignedExtra(eid) {
  var extras= JSON.parse(zakReservation.extras);
  var newextras= new Array();
  for(i=0;i<extras.length;i++) 
    if (extras[i]['id'] != eid) 
      newextras.push(extras[i]);
  var sextras= JSON.stringify(newextras);
  llModReservation(zakReservation.reservation.id, {extras: sextras},
    function(ses, recs) {
      zakReservation.extras= sextras;
      zakReservation.designExtras();
      humanMsg.displayMsg('Sounds good');
    }, 
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message, 1);
    });
}

function extraAppendAssigned(eid, how, cost) {
  var i, extras;
  extras= JSON.parse(zakReservation.extras);
  for(i=0;i<extras.length;i++) {
    if (extras[i]['id'] == eid) {
      extras[i]['how']= parseInt(extras[i]['how']) + parseInt(how);
      extras[i]['cost']= parseFloat(extras[i]['cost']) + parseFloat(cost);
      return {extras: extras, found: true};
    }
  }
  return {extras: extras, found: false};
}

function assignExtra() {
  var eid= $('#selectExtra').val();
  var how= $('#selectExtraHow').val();
  if (!eid || eid == 0) {
    humanMsg.displayMsg('Please, insert a new extra before', 1);
    return;
  }
  llLoadExtras(
    function(ses, recs) {
      var i, e, cost, name, sextras;
      for(i=0;i<recs.rows.length;i++) {
        e= recs.rows.item(i);
        if (e['id'] == eid) {cost= e['cost']; name= e['name']; break;}
      }

      var res= extraAppendAssigned(eid, how, cost);
      console.log(res);
      if (res['found']) 
        sextras= JSON.stringify(res['extras']);
      else {
        var extras= res['extras'];
        extras.push({id: eid, how: how, cost: parseFloat(cost) * parseInt(how), name: name}); 
        sextras= JSON.stringify(extras);
      }
      llModReservation(zakReservation.reservation.id, {extras: sextras},
        function(ses, recs) {
          zakReservation.extras= sextras;
          zakReservation.designExtras();
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

function addExtra() {
  var ename= $('#extra_name').val();
  var ecost= $('#extra_cost').val();
  var how= $('#extra_how').val();
  if (!checkFloat(ecost) || ! ename) {
    humanMsg.displayMsg('Please, specify good values', 1);
    return;
  }
  var fcost= parseFloat(ecost) * parseInt(how);
  llAddExtra(ename, ecost,
    function(ses, recs) {
      var eid= recs.insertId;
      if (zakReservation.extras) {
        var extras= JSON.parse(zakReservation.extras);
        extras.push({id: eid, how: how, cost: fcost, name: ename});
      }
      else var extras= [{id: eid, how: how, cost: fcost, name: ename}];
      var sextras= JSON.stringify(extras);
      llModReservation(zakReservation.reservation.id, {extras: sextras},
        function(ses, recs) {
          zakReservation.extras= sextras;
          zakReservation.designExtras();
          $.modal.close();
          humanMsg.displayMsg('Sounds good');
        }, function(ses, err) {humanMsg.displayMsg('Error: ' + err.message, 1);});
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message, 1);
    });
}

function saveRoomsPrices() {
  var i, j, rid, v;
  var occs= zakReservation.occupancies;
  var res= [], newar;
  for (i=0;i<occs.length;i++) {
    newar= new Array();
    rid= occs[i]['id_room'];
    console.log('Reading prices for ' + rid);
    newar.push(rid);
    for(j=1;j<zakTableau.lendays;j++) {
      v= $('#rprice_' + rid + '_' + j).val();
      if (!checkFloat(v)) {
        humanMsg.displayMsg('Please, specify good values', 1);
        return;
      }
      newar.push(parseFloat(v));
    }
    res.push(newar);
  }
  roomPricing= res;
  console.log('compacting');
  var sp= JSON.stringify(res);
  llModReservation(zakReservation.reservation.id, {custom_pricing: sp},
    function(ses, recs) {
      zakReservation.reservation.custom_pricing= sp;
      humanMsg.displayMsg('Sounds good');
      $('#restorePrices').hide();
      $('#storePricesButton').hide();
      zakReservation.designReadyPrices();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message, 1);
    });

}

function buildReservatioinInvoice() {
  localStorage.invoiceReservation= JSON.stringify(zakReservation.reservation);
  localStorage.invoiceOccupancyId= '';
  goToSameDirPage('invoice');
}
function buildOccupancyInvoice() {
}

function initReservation() {
  if (!localStorage.editOccupancyOid) {
    goToSameDirPage('tableau');
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
