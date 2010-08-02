invoiceReservation= false;
invoiceItems= [];
invoiceN= 0;

function _zakRoomName(rid) {
  for (i= 0; i< invoiceReservation.rooms.length; i++) {
    var room= invoiceReservation.rooms[i];
    if (room.id == rid) return room.name;
  }
  return '??';
}

function designFinal() {};

function _getPartial(tot, vat, name) {
  var netrate= tot / (1.0 + (vat/100.0));
  var netvat= tot - netrate;
  var res= '<div style="float:right;margin-top:10px"><table><tr><td>' + name;
  res+= '</td><td>' + netrate.toFixed(2) + '</td></tr>';
  res+= '<tr><td>Vat taxes:</td><td>' + netvat.toFixed(2) + '</td></tr>';
  res+= '<tr><td><b>Total:</b></td><td><b>' + tot.toFixed(2) + '</b></td></tr>';
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
    res+= '<td>' + _zakRoomName(pricing[k][0]) + '</td>';
  }
  res+= '<td></td></tr><tr>';
  for (var i= 1; i< rlen; i++) {
    var day= invoiceReservation.dfrom + (86400 * (i-1));
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
  $('#title_rooms').prepend(_getPartial(tot, 20, 'Rooms'));
  invoiceItems.push( {tot: tot, vat: 20, title: 'Rooms'} ); 
  checkFinal();
}

function designMeals() {
  var meals= invoiceReservation.meals;
  if (!meals) {
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
  var res= '<table>';
  for (var day in meals) {
    var sday= strDate(parseInt(day), 'd/m');
    var daymeals= meals[day];
    for (var i= 0; i< daymeals.length; i++) {
      var daymeal= daymeals[i];
      var pri= parseFloat(daymeal.price);
      tot+= pri;
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
  $('#title_meals').prepend(_getPartial(tot, 20, 'Meals'));
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
  console.log(extras);
  checkFinal();
}

function designInvoice() {
  invoiceN= 3;
  designInvoiceRooms();
  designMeals();
  designExtras();
}

$(document).ready(function() {
  llGetReservationFromRid(localStorage.editOccupancyRid,
    function(reservation) {
      invoiceReservation= reservation;
      designInvoice();
    });
});
