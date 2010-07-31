zakLookStatus= {
  look_customers: true,
  look_setup: true,
  look_meals: true,
  look_extras: true,
  look_reservations: true,
  look_pricing: true
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
  var rl= recs.rows.length;
  for (var i= 0; i< rl; i++) {
    var rec= recs.rows.item(i);
    rec.fromtable= tbl;
    putSearchResult(s, rec);
  }
}

function generalLook(f, s, tbl) {
  f(s, function(ses, recs) {
    _eatRecords(tbl, s, recs);
    afterLook(s);
  });
}

zakLookStatusf= {
  look_customers: function(s) {generalLook(llSearchCustomers, s, 'customer');},
  look_setup: function(s) {generalLook(llSearchSetups, s, 'setup');},
  look_meals: function(s) {generalLook(llSearchMeals, s, 'meal');}, 
  look_extras: function(s) {generalLook(llSearchExtras, s, 'extra');}, 
  look_reservations: function(s) {generalLook(llSearchReservations, s, 'reservation');},
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

$(document).ready(function() {
  var i= new Image();
  i.src= '/imgs/lgear.gif';
  $('.lookingi').change(function() {
    zakLookStatus[$(this).attr('id')]= $(this).is(':checked');
  });

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
