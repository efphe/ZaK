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
});


