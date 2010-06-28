function setActivePricing(prid) {
  localStorage.activePricing= prid;
}
function getActivePricing() {
  try {
    return localStorage.activePricing;
  } catch(e) {return false};
}
function saveBasePrices() {
  var pro= $('#price_ro').val();
  var pbb= $('#price_bb').val();
  var pfb= $('#price_fb').val();
  var phb= $('#price_hb').val();
  var prices= {price_ro: pro, price_fb: pfb, price_hb: phb, price_bb: pbb};
  for (var k in prices) {
    if (!checkFloat(prices[k])) {
      humanMsg.displayMsg('Please, specify valid values', 1);
      return;
    }
  }
  llModPropertyW(getActiveProperty()['id'], prices,
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: '+ err.message, 1);
    });
}

var iPricing= function() {
  this['periods']= new Array();
  this['designPrice']= function(price) {
    var sdfrom= strDate(price['dfrom']);
    var sdto= strDate(price['dto']);
    var res= '<td>' + sdfrom + '</td>';
    res+= '<td>' + sdto + '</td>';
    res+= '<td>' + price['price_ro'] + '</td>';
    res+= '<td>' + price['price_bb'] + '</td>';
    res+= '<td>' + price['price_hb'] + '</td>';
    res+= '<td>' + price['price_fb'] + '</td>';
    res+= '<td><a href="javascript:delPricePeriod(' + price['id'] + ')">Delete</a></td>';
    return '<tr>' + res + '</tr>';
  }
  this['designMe']= function() {
    var i;
    res= '';
    for(i=0;i<zakPricing.periods.length;i++) {
      res+= zakPricing.designPrice(zakPricing.periods[i]);
    }
    $('#defperiods').empty().append(res);
  }
  this['initPricing']= function() {
    zakPricing.periods= new Array();
    llLoadPricesPeriods(getActivePricing(),
      function(ses, recs) {
        var i;
        for(i=0;i<recs.rows.length;i++) 
          zakPricing.periods.push(recs.rows.item(i));
        zakPricing.designMe();
      },
      function(ses, err) {
        humanMsg.displayMsg('Error readin prices: ' + err.message);
      });
  }
  return this;
}

function delPricePeriod(pid) {
  llDelPricesPeriod(pid, 
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
      zakPricing.initPricing();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error deleting prices: ' + err.message);
    });
}

function newPricesPeriod() {
  var pdfrom= $('#pdfrom').val();
  var pdto= $('#pdto').val();
  var today= unixDate();
  pdfrom= unixDate(pdfrom);
  pdto= unixDate(pdto);
  if (pdfrom > pdto || pdfrom < today || pdto < today) {
    humanMsg.displayMsg('Please, specify valid dates', 1);
    return;
  }
  var pro= $('#pro').val();
  var pbb= $('#pbb').val();
  var pfb= $('#pfb').val();
  var phb= $('#phb').val();
  var prices= {price_ro: pro, price_fb: pfb, price_hb: phb, price_bb: pbb};
  for (var k in prices) {
    if (!checkFloat(prices[k])) {
      humanMsg.displayMsg('Please, specify valid values', 1);
      return;
    }
  }
  prices['dfrom']= pdfrom;
  prices['dto']= pdto;
  console.log('Launching now new prices');
  llNewPricesPeriod(false, [prices],
    function(ses, recs) {
      zakPricing.initPricing();
    });
}

function initBasePrices() {
  llLoadPricing(
    function(ses, recs) {
      if (recs.rows.length==0) {
        $('#newpricingname').val('Standard');
        $('#newpricing').modal({onClose: function() {
          console.log(getActivePricing());
          if (!getActivePricing()) initBasePrices();
        }});
        return;
      }
      var i, per, plist= new Array();
      var ap= getActivePricing();
      var res= '';
      for (i=0;i<recs.rows.length;i++) {
        per= recs.rows.item(i);
        if (per['id'] == ap || (!per['id'] && !ap)) {
          $('#price_ro').val(per['price_ro'] || '');
          $('#price_bb').val(per['price_bb'] || '');
          $('#price_fb').val(per['price_fb'] || '');
          $('#price_hb').val(per['price_hb'] || '');
          res+= '<option value="0">Default</option>';
        } else res+= '<option value="' + per['id'] + '">' + per['name'] + '</option>';
      }
      $('#selplan').empty().html(res);
      zakPricing= new iPricing();
      zakPricing.initPricing();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error loading meal plans: ' + err.message);
    });
  var prop= getActiveProperty();
}

function addRate() {
  var rname= $('newpricingname').val();
  if (!rname) {
    humanMsg.displayMsg('Please, specify a good value');
    return;
  }
  llNewPricing(rname, 
    function(ses, recs) {
      
      initBasePrices();
    },
    function(ses, err) {
    });
}

$(document).ready(function() {
  $('#pdfrom').datepicker({dateFormat: 'dd/mm/yy'});
  $('#pdto').datepicker({dateFormat: 'dd/mm/yy'});
  initBasePrices();
});
