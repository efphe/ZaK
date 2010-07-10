$(document).ready(function() {
  $('.hovergreen').hover(
    function(ev) {
      $(this).css('background-color', '#daffa9');
    },
    function(ev) {
      $(this).css('background-color', 'white');
    }
  );
  var nd= new Date();
  $('#today').val($.datepicker.formatDate('D M yy', nd));
  $('#vat').val('--');

  console.log('Initializing reservation');
  var reservation= JSON.parse(localStorage.invoiceReservation);
  zakReservation= iReservation(reservation, 1);
  zakReservation.loadTableau(zakReservation._designPrices);

  var extras= JSON.parse(zakReservation.extras);
  var res= '';
  var etotal= 0.0;
  for (var key in extras) {
    var extra= extras[key];
    res+= '<tr><td>' + extra['how'] + '</td><td>X</td>';
    res+= '<td>' + extra['name'] + '</td>';
    res+= '<td>' + extra['cost'] + '</td>';
    res+= '</tr>';
    etotal+= parseFloat(extra['cost']);
  }
  res+= '<tr><td colspan="3"><b>Total:</b></td><td>' + etotal.toFixed(2) + '</td></tr>';
  $('#extraspricing').html(res);
  $('#guest').html(zakReservation.reservation.customer);
  console.log(strDate(zakTableau.dfrom));
  $('#stay').html('From ' + strDate(zakTableau.dfrom) + ' to ' + strDate(dateAddDays(zakTableau.dfrom, zakTableau.lendays)));
  $('#itotal').html(etotal.toFixed(2));
});


