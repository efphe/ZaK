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

function putSearchResult(s, rec) {
  zakSearchCounter+= 1;
  if (!zakLookResults[s]) 
    zakLookResults[s]= [rec];
  else 
    zakLookResults[s].push(rec);

  var dis= "javascript:$('#div_search_" + zakSearchCounter + "').toggle()";
  var res= '';
  if (rec.fromtable == 'customer') {
    if (rec.gender == 1)
      var isrc= '/imgs/male.png';
    else
      var isrc= '/imgs/female.png';
    var img= '<a href="' + dis + '"><img style="margin-top:4px" src="' + isrc + '"></img></a> ';
    res+= '<div class="div_search">';
    res+= '<b>' + img + rec.name + '</b> (' + (rec.email || 'Unknown mail') + ')';
    res+= '<div class="div_search_content" style="display:none" id="div_search_' + zakSearchCounter + '">';
    res+= '<div style="float:right">';
    /*res+= '<a href="newReservation(' + rec.id + ')">Add reservation</a> ';*/
    res+= '<a href="editCustomer(' + rec.id + ')">Edit</a> ';
    res+= '<a href="delCustomer(' + rec.id + ')">Delete</a> ';
    res+= '</div>';
    res+= rec.name;
    res+= '<table>';
    res+= '<tr><td>Mail:</td><td>' + rec.email + '</td></tr>';
    res+= '<tr><td>Phone:</td><td>' + rec.phone + '</td></tr>';
    res+= '<tr><td>Country:</td><td>' + rec.country + '</td></tr>';
    res+= '<tr><td>City:</td><td>' + rec.city + '</td></tr>';
    res+= '<tr><td>Zip:</td><td>' + rec.zip + '</td></tr>';
    res+= '<tr><td>Address:</td><td>' + rec.address + '</td></tr>';
    res+= '<tr><td>Birth:</td><td>' + rec.bmonth + '/' + rec.byear + '</td></tr>';
    res+= '<tr><td>Remarks:</td><td>' + rec.notes + '</td></tr>';
    res+= '</table>';
    res+= '</div></div>';
  }

  $('#zakResults').append(res);
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
