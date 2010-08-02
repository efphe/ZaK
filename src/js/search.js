zakLookStatus= {
  look_customer: true,
  look_reservation: true,
  look_extra: true,
  look_meal: true,
  look_pricing: true,
  look_room_setup: true,
  look_room_type: true,
  look_room: true,
};

zakLookResults= {};
zakLookingResultsN= 0;
zakSearchCounter= 0;
zakSearchedNow= '';

function _i(iid, ivl, attrs) {
  var res= '<input type="text" id="' + iid + '" value="' + ivl + '"';
  if (attrs) res+= ' ' + attrs + ' ';
  res+= '></input>';
  return res;
}

cmbrtypes= false;

function _cmbMonths(iid) {
  return '<select id="' + iid + '">' + 
    '<option value="1">Jan</option>' + 
    '<option value="2">Feb</option>' + 
    '<option value="3">Mar</option>' + 
    '<option value="4">Apr</option>' + 
    '<option value="5">May</option>' + 
    '<option value="6">Jun</option>' + 
    '<option value="7">Jul</option>' + 
    '<option value="8">Aug</option>' + 
    '<option value="9">Sep</option>' + 
    '<option value="10">Oct</option>' +
    '<option value="11">Nov</option>' +
    '<option value="12">Dec</option></select>';
}
var _cmbGender= function(iid, m) {
    if (m==1) return '<select id="' + iid + '"><option value="1" selected="selected">Male</option><option value="2">Female</option></select>';
    return '<select id="' + iid + '"><option value="1">Male</option><option selected="selected" value="2">Female</option></select>';
}

var _cmbRtypes= function(rtid) {
  var res= '<select id="rt_newrtype_' + rtid + '">';
  for (var i= 0; i< cmbrtypes.length; i++) {
    var rt= cmbrtypes[i];
    if (rt.id == rtid) continue;
    res+= '<option value="' + rt.id + '">' + rt.name + '</option>';
  }
  res+= '</select>';
  return res;
}

function putSearchResult(s, rec) {
  zakSearchCounter+= 1;
  if (!zakLookResults[s]) 
    zakLookResults[s]= [rec];
  else 
    zakLookResults[s].push(rec);

  var afterF= [];
  var dis= "javascript:$('#div_search_" + zakSearchCounter + "').toggle()";
  var res= '';
  var _preamble= function(i, n, fdel) {
    var r= '<div class="div_search"><a href="' + dis + '"><img src="' + i + '"></img></a> <b>' + n + '</b>';
    r+= '<div class="div_search_content" style="display:none" id="div_search_' + zakSearchCounter + '">';
    if (fdel) {
      r+= '<div style="float:right">';
      r+= '<input type="submit" value="Delete" onclick="' + fdel + '(' + rec.id + ')"></input>';
      r+= '</div>';
    }
    return r;
  };

  if (rec.fromtable == 'reservation') {
    res+= _preamble('/imgs/reservation.png', rec.rname || rec.customer, 'delReservation');
    res+= '<b>' + rec.customer + '</b>';
    res+= '<table>';
    res+= '<tr>';
    res+= '<td>Arrival Date:</td>';
    res+= '<td>' + strDate(rec.dfrom) + '</td>';
    res+= '</tr>';
    res+= '<tr>';
    res+= '<td>Departure Date:</td>';
    res+= '<td>' + strDate(rec.dto) + '</td>';
    res+= '</tr>';
    res+= '<tr>';
    res+= '<td>Status:</td>';
    res+= '<td><select id="res_status_' + rec.id + '">'; 
    var _stats= ['Confirmed', 'Not confirmed', 'Checkin\'ed', 'Option'];
    for (var i= 1; i< 5; i++) {
      if (i == rec.status) res+= '<option value="' + i + '" selected="selected">' + _stats[i-1] + '</option>';
      else res+= '<option value="' + i + '">' + _stats[i-1] + '</option>';
    }
    res+= '</select>';
    /*res+= '<tr><td colspan="2" align="center">';*/
    res+= '<input type="submit" value="Update status" onclick="changeResevationStatus(' + rec.id + ')"></input>';
    res+= '</td>';
    res+= '</tr>';
    /*res+= '</td></tr>';*/
    res+= '</table>';
    res+= 'Actions<br/>';
    res+= '<input type="submit" onclick="goTableau(' + rec.id + ')" value="Go to tableau"></input>';
    res+= '<input type="submit" onclick="goDetails(' + rec.id + ')" value="Go to details"></input>';
    res+= '</div>';
  }

  if (rec.fromtable == 'room') {
    res+= _preamble('/imgs/room.png', rec.name, 'delRoom');
    res+= '<b>' + rec.name + '</b>';
    res+= '<table><tr><td>Name</td>';
    res+= '<td><input type="text" value="' + rec.name + '" id="room_name_' + rec.id + '"></input></td></tr>';
    res+= '<tr><td>Code</td>';
    res+= '<td><input type="text" value="' + rec.code + '" id="room_code_' + rec.id + '"></input></td></tr>';
    res+= '<tr><td colspan="2" align="center"><input type="submit" value="Update room" onclick="updateRoom(' + rec.id + ')"></input></td></tr>';
    res+= '</table>';
    res+= '</div>';
  }

  if (rec.fromtable == 'room_setup') {
    res+= _preamble('/imgs/room_setup.png', rec.name, 'delRoomSetup');
    res+= '<b>' + rec.name + '</b>';
    res+= '<table><tr>';
    res+= '<td>Name</td>';
    res+= '<td><input type="text" value="' + rec.name + '" id="rs_name_' + rec.id + '"></input></td></tr>';
    res+= '<tr><td colspan="2" align="center"><input type="submit" value="Update Name" onclick="updateRoomSetup(' + rec.id + ')"></input></td></tr>';
    res+= '</table>';
    res+= '</div>';
  }

  if (rec.fromtable == 'room_type') {
    res+= _preamble('/imgs/room_type.png', rec.name);
    res+= '<b>' + rec.name + '</b>';
    res+= '<table><tr>';
    res+= '<td>Name</td>';
    res+= '<td><input type="text" value="' + rec.name + '" id="rt_name_' + rec.id + '"></input></td></tr>';
    res+= '<tr><td colspan="2" align="center"><input type="submit" value="Update Name" onclick="updateRoomType(' + rec.id + ')"></input></td></tr>';
    res+= '</table>';
    res+= '<br/>';
    res+= 'Delete this room type and set orphaned rooms to this: ';
    res+= _cmbRtypes(rec.id);
    res+= '<input type="submit" value="Delete" onclick="delRoomType(' + rec.id + ')"></input>';
    res+= '</div>';
  }

  if (rec.fromtable == 'meal') {
    res+= _preamble('/imgs/meal.png', rec.name, 'delMeal');
    res+= '<b>' + rec.name + '</b>';
    res+= '<table><tr>';
    res+= '<td>Name</td>';
    res+= '<td><input type="text" value="' + rec.name + '" id="m_name_' + rec.id + '"></input></td></tr>';
    res+= '<tr><td>Cost</td>';
    res+= '<td><input style="width:60px" type="text" value="' + rec.price + '" id="m_price_' + rec.id + '"></input></td></tr>';
    res+= '<tr><td>Vat</td>';
    res+= '<td><input style="width:40px" type="text" value="' + rec.vat + '" id="m_vat_' + rec.id + '">';
    res+= '</input></td></tr>';
    res+= '<tr><td>Type:</td><td><select id="m_mtype_' + rec.id + '">';
    var amtype= rec.mtype;
    var amtypes= ['BB', 'Half board', 'Full board'];
    for (var j= 1; j< 4; j++) {
      if (j == amtype) res+= '<option selected="selected" value="' + j + '">' + amtypes[j-1] + '</option>';
      else res+= '<option value="' + j + '">' + amtypes[j-1] + '</option>';
    }
    res+= '</select></td></tr>';
    res+= '<tr><td colspan="2" align="center"><input type="submit" value="Update meal"';
    res+= ' onclick="updateMeal(' + rec.id + ')"></td></tr></table>';
    res+= '</div>';
  }

  if (rec.fromtable == 'extra') {
    res+= _preamble('/imgs/extra.png', rec.name, 'delExtra');
    res+= '<b>' + rec.name + '</b>';
    res+= '<table><tr>';
    res+= '<td>Name</td>';
    res+= '<td><input type="text" value="' + rec.name + '" id="e_name_' + rec.id + '"></input></td></tr>';
    res+= '<tr><td>Cost</td>';
    res+= '<td><input style="width:60px" type="text" value="' + rec.cost + '" id="e_cost_' + rec.id + '"></input></td></tr>';
    res+= '<tr><td>Vat</td>';
    res+= '<td><input style="width:40px" type="text" value="' + rec.vat + '" id="e_vat_' + rec.id + '"></input></td></tr>';
    res+= '<tr><td>Per day</td>';
    res+= '<td><select id="e_perday_' + rec.id + '">';
    if (rec.perday) 
      res+= '<option value="1" selected="selected">Yes</option><option value="0">No</option></select>';
    else
      res+= '<option value="1">Yes</option><option selected="selected" value="0">No</option></select>';
    res+= '</td></tr>';
    res+= '<tr><td colspan="2" align="center"><input type="submit" value="Update Extra" onclick="updateExtra(' + rec.id + ')"></input></td></tr>';
    res+= '</table>';
    res+= '</div>';
  }

  if (rec.fromtable == 'pricing') {
    res+= _preamble('/imgs/pricing.png', rec.name, 'delPricing');
    res+= '<b>' + rec.name + '</b>';
    res+= '<table><tr>';
    res+= '<td>Name</td>';
    res+= '<td><input type="text" value="' + rec.name + '" id="p_name_' + rec.id + '"></input></td></tr>';
    res+= '<tr><td colspan="2" align="center"><input type="submit" value="Update Name" onclick="updatePricing(' + rec.id + ')"></input></td></tr>';
    res+= '</table>';
    res+= '</div>';
  }

  if (rec.fromtable == 'customer') {
    if (rec.gender == 1)
      var isrc= '/imgs/male.png';
    else
      var isrc= '/imgs/female.png';
    var rid= rec.id;
    if (rec.email)
      res+= _preamble(isrc, '<b>' + rec.name + '</b> (' + rec.email + ')', 'delCustomer');
    else
      res+= _preamble(isrc, '<b>' + rec.name + '</b>', 'delCustomer');
    var _ii= function(n, attrs) {
      return _i('c_' + n + '_' + rid, rec[n], attrs);
    }
    if (rec.country_code)
      res+= '<img src="/imgs/flags/' + rec.country_code.toLowerCase() + '.gif"></img> ' + rec.name;
    else
      res+= rec.name;
    res+= '<input type="submit" style="float:right" value="New reservation" onclick="newReservation(' + rid + ')"></input>';
    res+= '<table>';
    res+= '<tr><td>Name:</td><td>' + _ii('name') +'</td>' + '<td colspan="2">' + _cmbGender('c_gender_' + rid, rec.gender) + '</td></tr>';
    res+= '<tr><td>Mail:</td><td>' + _ii('email') + '</td>';
    res+= '<td>Phone:</td><td>' + _ii('phone') + '</td></tr>';
    res+= '<tr><td>City:</td><td>' + _ii('city') + '</td>';
    res+= '<td>Zip:</td><td>' + _ii('zip') + '</td></tr>';
    res+= '<tr><td>Address:</td><td>' + _ii('address') + '</td></tr>';
    res+= '<tr>';
    res+= '<td>Birth pl.:</td><td>' + _ii('bplace') + '</td>';
    res+= '<td>Birth:</td><td>' + _cmbMonths('c_bmonth_' + rid) + _ii('byear', 'style="width:60px"')+'</td>';
    res+= '</tr>';
    res+= '<tr><td>Remarks:</td><td colspan="3"><textarea style="width:100%;height:80px" id="c_notes_' + rid + '">' + rec.notes + '</textarea></td></tr>';
    res+= '<tr><td align="center" colspan="2"><input onclick="updateCustomer(' + rid + ')" type="submit" value="Update customer"></input></td></tr></table>';
    res+= '</div></div>';
    afterF.push(function() {$('#c_month_' + rid).val(rec.bmonth);});
  }

  $('#zakResults').append(res);
  for (var i= 0; i< afterF.length; i++) afterF[i]();
}

function afterLook(s) {
  zakLookingResultsN-= 1;
  if (zakLookingResultsN == 0) {
    $('#zakIsearch').hide();
    if (!zakLookResults[s]) $('#zakResults').html('No results');
  }
}

function _eatRecords(tbl, s, recs) {
  if (recs.rows) {
    var rl= recs.rows.length;
    for (var i= 0; i< rl; i++) {
      var rec= recs.rows.item(i);
      rec.fromtable= tbl;
      putSearchResult(s, rec);
    }
  } else {
    for (var i= 0; i< recs.length; i++) {
      rec= recs[i];
      rec.fromtable= tbl;
      putSearchResult(s, rec);
  }}
      
}

function generalLook(f, s, tbl) {
  f(s, function(ses, recs) {
    _eatRecords(tbl, s, recs);
    afterLook(s);
  });
}

zakLookStatusf= {
  look_customer: function(s) {generalLook(llSearchCustomers, s, 'customer');},
  look_room_setup: function(s) {generalLook(llSearchRoomSetup, s, 'room_setup');},
  look_room_type: function(s) {generalLook(llSearchRoomType, s, 'room_type');},
  look_room: function(s) {generalLook(llSearchRoom, s, 'room');},
  look_meal: function(s) {generalLook(llSearchMeals, s, 'meal');}, 
  look_extra: function(s) {generalLook(llSearchExtras, s, 'extra');}, 
  look_reservation: function(s) {generalLook(llSearchReservations, s, 'reservation');},
  look_pricing: function(s) {generalLook(llSearchPricing, s, 'pricing');}
}

function goWithSearch(s) {
  zakLookingResultsN= 0;
  console.log('Beginning search: ' + s);
  for (var k  in zakLookStatus)
    if (zakLookStatus[k]) {
      $('#zakHint').hide();
      $('#zakResults').empty();
      zakLookingResultsN+= 1;
      try {
        zakLookStatusf[k](s);
      } catch(e) {console.log('Error searching: ' + e); afterLook(s);}
    }
}

function newReservation(cid) {
  $('#newreservation_customer').val(cid);
  $('#newreservation_continue').hide();
  $('#newreservation_check').show();
  $("#newreservation_arrival").remove();
  $('#newreservation_nights').val('');
  $('#nra_cnt').append('<input type="text" id="newreservation_arrival"></input>');
  $("#newreservation_arrival").datepicker({showAnim: '', dateFormat: 'dd/mm/yy'});
  llLoadRooms(getActiveProperty()['id'], 
    function(ses, recs) {
      var res= '';
      for (var i= 0; i< recs.rows.length; i++) {
        var room= recs.rows.item(i);
        res+= '<option value="' + room.id + '">' + room.code + '</option>';
      }
      $('#newreservation_room').empty().html(res);
      $('#newreservation_div').modal();
    }, function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
      return;
    });
}

function changeResevationStatus(rid) {
  var newst= $('#res_status_' + rid).val();
  if (newst != parseInt(newst)) {
    return;
  }
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('update occupancy set status = ? where id_reservation = ?', [newst,rid],
      function(ses, recs) {
        humanMsg.displayMsg('Sounds good');
      },
      function(ses, err) {
        humanMsg.displayMsg('Error there: ' + err.message);
      });
  });

}

function checkAvailability() {
  var rid= $('#newreservation_room').val();
  var ard= $('#newreservation_arrival').val();
  var nights= $('#newreservation_nights').val();
  if (!rid || parseInt(nights) != nights || nights < 1 || !ard) {
    humanMsg.displayMsg('Please, specify good values');
    return;
  }
  llCheckOccupancyChance(false, rid, ard, nights, {foo: 'bar'},
    function(ses, args) {
      if (!args) {
       $('#newreservation_check').hide();
       $('#newreservation_noavail').show();
       return;
      }
     $('#newreservation_check').hide();
     $('#newreservation_continue').show();
    });
}

function insertReservation() {
  var rid= $('#newreservation_room').val();
  var cid= $('#newreservation_customer').val();
  console.log('New reservation cid: ' + cid);
  var ard= $('#newreservation_arrival').val();
  var nights= $('#newreservation_nights').val();
  var stat= $('#newreservation_status').val() || 1;
  llNewOccupancy(getActiveProperty()['id'], false, stat, rid, ard, nights, false, cid,
    function(ses, recs) {
      if (!ses) {
        humanMsg.displayMsg('Error there');
        return;
      }
      humanMsg.displayMsg('Welcome back!');
      $.modal.close();
      $.modal.close();
    }, 
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
    });
}

$(document).ready(function() {
  var i= new Image();
  i.src= '/imgs/lgear.gif';
  $('.lookingi').change(function() {
    zakLookStatus[$(this).attr('id')]= $(this).is(':checked');
  });

  llGetRoomTypes(function(ses, recs) {

    cmbrtypes= arrayFromRecords(recs);
    $('#zakSearch').keyup(function() {
      console.log('change');
      var ss= $('#zakSearch').val();
      if (ss == zakSearchedNow) return;
      else zakSearchedNow= ss;
      if (ss.length >= 2) {
        $('#zakIsearch').show();
        goWithSearch(ss);
      }
      });

  });

});
