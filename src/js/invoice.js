_vatPerc= false;
$(document).ready(function() {
  var ib= JSON.parse(localStorage.invoiceBuilding);
  var rid= ib.rid;
  var oid= ib.oid;
  llGetInvoice(rid, oid,
    function(record) {
      var cust= record.icustomer || record.customer;
      var ivat= record.ivat || '';
      var idate= record.idate || $.datepicker.formatDate('D M yy', new Date());
      $('#customer').val(cust);
      $('#vat').val(ivat);
      $('#date').val(idate);
      getPropertySettings(function(ses, sets) {
        /* id is id invoice, id is not selected from other
         * tables by llGetInvoice */
        if (!record.id) {
          $('#buthandler').show();
          $('#header').val(sets.vatheader);
        } else {
          $('#header').val(record.iheader || '');
        }
        $('#vatname').val(sets.vatname);
        _vatPerc= sets.vatperc;
      });

    });

  llGetReservation(rid, oid, 
    function(res) {
    },
    function(ses, err) {
      console.log('Error there: ' + err.message);
    });

  /* graphic details */
  $('.hovergreen').hover(
    function(ev) {
      $(this).css('background-color', '#daffa9');
    },
    function(ev) {
      $(this).css('background-color', 'white');
    }
  );

});



/*$(document).ready(function() {*/
/*var nd= new Date();*/
/*$('#today').val($.datepicker.formatDate('D M yy', nd));*/
/*$('#vat').val('--');*/

/*console.log('Initializing reservation');*/
/*var reservationId= JSON.parse(localStorage.invoiceReservation);*/
/*llGetReservationFromRid(reservationId, */
/*function(reservation) {*/
/*zakReservation= iReservation(reservation, 1);*/

/*try {*/
/*var extras= JSON.parse(zakReservation.extras);*/
/*var res= '';*/
/*var etotal= 0.0;*/
/*for (var key in extras) {*/
/*var extra= extras[key];*/
/*res+= '<tr><td>' + extra['how'] + '</td><td>X</td>';*/
/*res+= '<td>' + extra['name'] + '</td>';*/
/*res+= '<td>' + extra['cost'] + '</td>';*/
/*res+= '</tr>';*/
/*etotal+= parseFloat(extra['cost']);*/
/*}*/
/*res+= '<tr><td colspan="3"><b>Total:</b></td><td>' + etotal.toFixed(2) + '</td></tr>';*/
/*$('#extraspricing').html(res);*/
/*} catch(e) {*/
/*etotal= 0.0;*/
/*}*/
/*$('#totextras').html(etotal.toFixed(2));*/
/*$('#guest').html(zakReservation.reservation.customer);*/
/*console.log(strDate(zakTableau.dfrom));*/

/*llNextInvoiceNumber(getActiveProperty()['id'],*/
/*function(n) {*/
/*console.log('Number invoice: ' + n);*/
/*$('#invoiceN').html(n);*/
/*});*/

/*zakReservation.loadTableau(function() {*/
/*zakReservation._designPrices();*/
/*var count= 0.0;*/
/*for (var j in roomPricing) {*/
/*var rp= roomPricing[j];*/
/*for (var i= 1; i< rp.length; i++) {*/
/*count+= parseFloat(rp[i]);*/
/*}*/
/*}*/
/*$('#totrooms').html(count.toFixed(2));*/
/*count+= parseFloat(etotal);*/
/*$('#itotal').html(count.toFixed(2) + ' &#8364');*/
/*$('#stay').html('From ' + strDate(zakTableau.dfrom) + ' to ' + strDate(dateAddDays(zakTableau.dfrom, zakTableau.lendays)));*/
/*});*/
/*});*/

/*});*/

function exitInvoice() {
  goToSameDirPage('book');
}

function saveInvoice() {
  var guest= $('#guest').val();
  var today= $('#today').val();
  var vat= $('#vat').val();
  var inv= {guest: guest, today: today, vat: vat};
  alert('Now saving');
  /*llSaveInvoice(getActiveProperty()['id'], n, zakReservation.reservation.id, false, html, function() {alert('ok');});*/
}

