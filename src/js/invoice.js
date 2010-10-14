invoiceReservation= false;
invoiceItems= [];
invoiceSettings= '';
invoiceN= 0;

function _zakRoomName(rid) {
  for (i= 0; i< invoiceReservation.rooms.length; i++) {
    var room= invoiceReservation.rooms[i];
    if (room.id == rid) return room.name;
  }
  return '??';
}

function designFinal() {
  var tot= 0.0;
  var nettot= 0.0;
  for (var i= 0; i< invoiceItems.length; i++) {
    var ii= invoiceItems[i];
    var itot= parseFloat(ii.tot);
    tot+= itot;
    nettot+= itot / (1.0 + (ii.vat/100.0));
  }
  $('#itotal').append(_getPartial(tot, (1.0 - (nettot/tot)) * 100.0, 'Total', 'margin-left:30px;margin-top:2px'));
};

function _getPartial(tot, vat, name, addst) {
  var netrate= tot / (1.0 + (vat/100.0));
  var netvat= tot - netrate;
  var st= 'float:right;margin-top:20px;';
  if (addst) st+= addst;
  var res= '<div style="' + st + '"><table><tr><td>' + name;
  res+= '</td><td>' + netrate.toFixed(2) + '</td></tr>';
  res+= '<tr><td>Vat taxes:</td><td>' + netvat.toFixed(2) + '</td></tr>';
  res+= '<tr><td><b>Total:</b></td><td><b>' + tot.toFixed(2) + ' ' + getCurrency() + '</b></td></tr>';
  res+= '</table></div>';
  return res;
}

function checkFinal() {
  invoiceN-= 1;
  if (invoiceN == 0) designFinal();
}

function designInvoiceRooms() {
  console.log('Designing pricing');
  var pricing= invoiceReservation.custom_pricing;
  if (!pricing) {
    $('#rooms_table').hide();
    $('#title_rooms').hide();
    checkFinal(); 
    return;
  }
  try {pricing= JSON.parse(pricing)} catch(e) {
    $('#rooms_table').hide();
    $('#title_rooms').hide();
    checkFinal();
    return;
  };
  for (var k in pricing) {
    var rlen= pricing[k].length;
    break
  }
  var tot= 0.0;
  var dtot= {};
  var res= '<table><tr><td></td>';
  for (var k in pricing) {
    res+= '<td>' + _zakRoomName(k) + '</td>';
  }
  res+= '<td></td></tr><tr>';
  for (var i= 0; i< rlen; i++) {
    var day= invoiceReservation.dfrom + (86400 * i);
    day= strDate(day, 'd/m');
    res+= '<td>' + day + '</td>';
    for (k in pricing) {
      var pri= parseFloat(pricing[k][i]);
      res+= '<td>' + pri + '</td>';
      tot+= pri;
      if (dtot[k]) dtot[k]+= parseFloat(pri);
      else dtot[k]= parseFloat(pri);
    }
    res+= '<td></td></tr>';
  }
  res+= '<tr><td>Tot.</td>';
  for (var k in dtot) {
    res+= '<td>' + dtot[k] + '</td>';
  }
  res+= '<td><b>' + tot + '</b></td></tr>';
  $('#rooms_table').html(res);
  var rvat= parseFloat(invoiceSettings.vatSettingsPerc);
  $('#title_rooms').prepend(_getPartial(tot, rvat, 'Rooms'));
  invoiceItems.push( {tot: tot, vat: rvat, title: 'Rooms'} ); 
  checkFinal();
}

function designMeals() {
  var meals= invoiceReservation.meals;
  if (!meals) {
    $('#meals_table').hide();
    $('#title_meals').hide();
    checkFinal();
    return;
  }
  try {meals= JSON.parse(meals);} catch(e) {
    $('#meals_table').hide();
    $('#title_meals').hide();
    checkFinal();
    return;
  }
  if (!meals) {
    $('#meals_table').hide();
    $('#title_meals').hide();
    checkFinal();
    return;
  }
  var tot= 0.0;
  var nettot= 0.0;
  var res= '<table>';
  for (var day in meals) {
    var sday= strDate(parseInt(day), 'd/m');
    var daymeals= meals[day];
    for (var i= 0; i< daymeals.length; i++) {
      var daymeal= daymeals[i];
      var pri= parseFloat(daymeal.price);
      tot+= pri;
      nettot+= pri / (1.0 + (daymeal.vat/100.0));
      if (i == 0)
        res+= '<tr><td>' + sday + '</td>';
      else
        res+= '<tr><td></td>';
      /*res+= '<td>' + daymeal.how + ' X </td>';*/
      res+= '<td>' + daymeal.name + ' (' + daymeal.how + 'x) </td>';
      res+= '<td>' + pri + '</td>';
      res+= '</tr>';
    }
  }
  res+= '<tr><td colspan="2" align="center">Total</td><td><b>' + tot + '</b></td>';
  res+= '</table>';
  $('#meals_table').html(res);
  $('#title_meals').prepend(_getPartial(tot, (1.0 - (nettot/tot)) * 100.0, 'Meals'));
  invoiceItems.push( {tot: tot, vat: (1.0 - (nettot/tot)) * 100.0, title: 'Meals'} ); 
  /*console.log(meals);*/
  checkFinal();
}

function designExtras() {
  var extras= invoiceReservation.extras;
  if (!extras) {
    $('#extras_table').hide();
    $('#title_extras').hide();
    checkFinal(); 
    return;
  }
  try {
    extras= JSON.parse(extras);
  } catch(e) {
    $('#extras_table').hide();
    $('#title_extras').hide();
    checkFinal(); 
    return;
  };
  if (!extras) {
    $('#extras_table').hide();
    $('#title_extras').hide();
    checkFinal();
    return;
  };
  var tot= 0.0;
  var nettot= 0.0;
  var res= '<table>';
  for (var i= 0; i< extras.length; i++) {
    var ex= extras[i];
    var pri= parseFloat(ex.cost);
    tot+= pri;
    nettot+= pri / (1.0 + (ex.vat/100.0));
    res+= '<tr><td>' + ex.name + '(' + ex.how + 'x)</td><td>' + pri.toFixed(2) + '</td></tr>';
  }
  res+= '<tr><td>Total</td><td><b>' + tot.toFixed(2) + '</b></td>';
  res+= '</table>';
  $('#extras_table').html(res);
  $('#title_extras').prepend(_getPartial(tot, (1.0 - (nettot/tot)) * 100.0, 'Extras'));
  invoiceItems.push( {tot: tot, vat: (1.0 - (nettot/tot)) * 100.0, title: 'Extras'} ); 
  /*console.log(extras);*/
  checkFinal();
}

function designInvoice() {
  invoiceN= 3;
  designInvoiceRooms();
  designMeals();
  designExtras();
}

function exitInvoice() {
  goToSameDirPage('reservation');
}

function saveInvoice() {
  var html= $('#invoice_div').html();
  var n= $('#inumber').val();
  var head= $('#iheader').val();
  var chead= $('#cheader').val();
  var rid= localStorage.editOccupancyRid;
  var it= localStorage.editInvoiceItype;
  llSaveInvoice(rid, html, n, head, chead, it,
    function(ses, recs) {
      window.location.reload(false);
    },
    function(ses, err) {
      console.log('Error: ' + err.message);
      alert('Error: ' + err.message);
    });
}

function _buildNew() {
  llGetReservationFromRid(localStorage.editOccupancyRid,
    function(reservation) {
      invoiceReservation= reservation;
      llGetPropertySettings(getActiveProperty()['id'], 
        function(ses, recs, sets) {
          invoiceSettings= sets;
          $('#iheader').val(sets.vatSettingsHeader || '');
          designInvoice();
        });
    });
  llGetItypes(function(ses, recs) {
    for (var j= 0; j< recs.rows.length; j++) {
      var it= recs.rows.item(j);
      var dit= '';
      if (it.id == localStorage.editInvoiceItype) {
        $('#iname').html(it.name);
        dit= it.id;
      }
    }
  });
  llGetReservationInvoiceHeader(localStorage.editOccupancyRid,
    function(ses, recs) {
      if (recs.rows.length > 0) {
        $('#cheader').val(recs.rows.item(0).vat);
      }
    });
  llGetInvoiceN(getActiveProperty()['id'], localStorage.editInvoiceItype,
    function(n) {
      console.log('Last invoice: ' + n);
      $('#inumber').val(n);
    });
}

function _buildOld(i) {
  $('#invoice_div').html($.base64Decode(i.html));
  $('#iheader').val(i.head);
  $('#cheader').val(i.chead);
  $('#bSaveInvoice').hide();
  $('#inumber').attr('readonly', 'readonly');
  $('#inumber').val(i.n);
  $('textarea').attr('readonly', 'readonly');
}

$(document).ready(function() {
  llGetReservationInvoice(localStorage.editOccupancyRid,
    function(ses, recs) {
      if (recs.rows.length == 0) _buildNew();
      else _buildOld(recs.rows.item(0));
    });
});
