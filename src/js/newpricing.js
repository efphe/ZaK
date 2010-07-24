_zakRtypes= [];

function designPricing() {

  llLoadPricings(function(ses, recs) {
    var rres= '';
    for (var i= 0; i< recs.rows.length; i++) {
      var p= recs.rows.item(i);
      rres+= '<option value="' + p.id + '">' + p.name + '</option>';
    }
    $('#selplan').empty().html(rres);
  }, function(ses, err) {humanMsg.displayMsg('Error there: '+ err.message)});

  llLoadPricing(getActivePricing(), 
    function(ses, recs) {
      console.log(recs);
      var p= recs.rows.item(0);
      try {
        var prices= JSON.parse(p.pricing);
      } catch(e) {var prices= -1;};
      var res= '';

      function _gp(rt) {
        try {
          return prices[rt] || 0.0;
        } catch(e) {return 0.0};
      }

      for (var i= 0; i< _zakRtypes.length; i++) {
        var rtype= _zakRtypes[i];
        res+= '<tr><td>' + rtype.name + '</td>';
        res+= '<td><input type="text" id="price_' + rtype.id + '" style="width:75px" value="';
        res+= _gp(rtype.id) + '"></input>';
      }
      $('#defprices').empty().html(res);
    });
}

function getActivePricing() {
  return localStorage.activePricing || '';
}

function setActivePricing(pid) {
  localStorage.activePricing= pid;
}

function askNewPricing() {
  $('#newpricing').modal({onClose: function() {
    if (!getActivePricing()) {
      askNewPricing();
      }
  }});
}

function addPricing() {
  var rname= $('#newpricing_name').val();
  if (!rname) {
    humanMsg.displayMsg('Please, specify a good value');
    return;
  }
  llNewPricing(rname, 
    function(ses, recs) {
      setActivePricing(recs.insertId);
      $.modal.close();
      $.modal.close();
      designPricing();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message);
    });
}

$(document).ready(function() {
  llGetRoomTypes(function(ses, recs) {
    for (var i= 0; i< recs.rows.length; i++) {
      var rt= recs.rows.item(i);
      _zakRtypes.push(rt);
    }
    var ap= getActivePricing();
    if (!ap) {
      llLoadPricings(function(ses, recs) {
        if (recs.rows.length != 0) {
          setActivePricing(recs.rows.item(0));
          designPricing();
          return;
        }
        askNewPricing();
        return;
      });
    }
    else designPricing();
  }, function(ses, err) {
    humanMsg.displayMsg('Error there: ' + err.message);
  });
});
