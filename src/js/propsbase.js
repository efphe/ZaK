function setActiveProperty(prop, cbs, cbe) {
  if (parseInt(prop) != prop) {
    localStorage.activeProperty= JSON.stringify(prop);
    console.log('Active property to: ' + localStorage.activeProperty);
    return;
  }
  llGetProperties(
      function(ses, recs) {
        var i;
        console.log('Looking for right property');
        for(i=0;i<recs.rows.length;i++) {
          if (recs.rows.item(i)['id'] == prop) {
            console.log('Found right property');
            setActiveProperty(recs.rows.item(i));
            cbs();
          }
        }
      },
      function(ses, err) {
        humanMsg.displayMsg('Error selecting property: ' + err.message);
      });
}

_modalNewRes= '' + 
' <div id="addNewFlyReservation" style="display:none" class="zakmodal">'+
'<h1>Add a new reservation</h1>'+
'<h2>Please, insert reservation data</h2>'+
'<table>'+
'<tr><td>Arrival:</td><td>'+
'<input type="text" style="width:150px" id="flyReservationWhen"></input></td></tr>'+
'<tr>'+
'<td>'+
'Nights:'+
'</td>'+
'<td>'+
'<select id="addNewFlyReservationNightsCmb">'+
'<option value="z" selected="selected">--</option>'+
'<option value="1">1</option>'+
'<option value="2">2</option>'+
'<option value="3">3</option>'+
'<option value="4">4</option>'+
'<option value="5">5</option>'+
'<option value="6">6</option>'+
'<option value="7">7</option>'+
'<option value="8">8</option>'+
'<option value="9">9</option>'+
'<option value="10">10</option>'+
'<option value="11">11</option>'+
'<option value="12">12</option>'+
'<option value="13">13</option>'+
'<option value="14">14</option>'+
'<option value="15">15</option>'+
'</select>'+
'</td>'+
'</tr>'+
'<tr>'+
'<td>'+
'          Customer'+
'</td>'+
'<td>'+
'<input type="text" id="addNewFlyReservationCustomer"></input>'+
'</td>'+
'</tr>'+
'<tr>'+
'<td>'+
'          Status:'+
'</td>'+
'<td>'+
'<select id="addNewFlyReservationStatus">'+
'<option value="1" selected="selected">Confirmed</option>'+
'<option value="2">Not confirmed</option>'+
'<option value="3">Checkin\'ed</option>'+
'<option value="4">Option</option>'+
'</select>'+
'</td>'+
'</tr>'+
'<tr>'+
'<td>'+
'          Go to details:'+
'</td>'+
'<td>'+
'<input type="checkbox" id="addNewFlyReservationDetails" checked="checked"></input>'+
'</td>'+
'</tr>'+
'</table>'+
'<div style="float:right">'+
'<a style="color:#36ff00;font-weight:bold" href="javascript:_addNewReservation()">Continue</a> '+
'<a style="color:red;font-weight:bold" href="javascript:$.modal.close()">Cancel</a>'+
'</div>'+
'<br/>'+
'</div>';


function flyReservation() {
  var fr= $('#addNewFlyReservation');
  if (fr.length == 0) {
    $('body').append(_modalNewRes);
    return flyReservation();
  }
  $('#flyReservationWhen').datepicker();
  $('#addNewFlyReservation').modal();
}

function getActiveProperty() {
  try {
    return JSON.parse(localStorage.activeProperty);
  } catch(e) {return false;}
}
