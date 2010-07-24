/* 
 * localStorage.editOccupancyOid
 * localStorage.editOccupancyRid
 */

editReservation= false;

function designOccupancies() {
  
}

function designOccupancy() {
  var oid= localStorage.editOccupancyOid;
  llLoadOccupancy(oid,
    function(ses, recs) {
      var occ= recs.rows.item(0);
      var rid= occ['id_room'];
      $('#selRoomSetup').val(rid);
    });
}

function designReservation() {
  var r= llGetReservationFromRid(localStorage.editOccupancyRid,
    function(reservation) {
      editReservation= reservation;
      designOccupancies();
    });
}
