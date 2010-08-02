invoiceReservation= false;
invoiceItems= [];

function _getPartial(tot, vat, name) {
  var netrate= tot / (1.0 + (vat/100.0));
  var netvat= tot - netrate;
  var res= '<div style="float:right"><table><tr><td>' + name + '</td><td>' + netrate + '</td></tr>';
  res+= '<tr><td>Vat taxes:</td><td>' + netvat + '</td></tr>';
  res+= '<tr><td><b>Total:</b></td><td>' + tot + '</td></tr>';
  res+= '</table></div>';
  return res;
}

function designInvoiceRooms() {
  var pricing= invoiceReservation.custom_pricing;
  if (!pricing) return;
  try {pricing= JSON.parse(pricing)} catch(e) {return;};
  console.log(pricing);
}

function designInvoice() {
  designInvoiceRooms();
}

$(document).ready(function() {
  llGetReservationFromRid(localStorage.editOccupancyRid,
    function(reservation) {
      invoiceReservation= reservation;
      designInvoice();
    });
});
