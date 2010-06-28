function setActivePricing(prid) {
  localStorage.activePricing= prid;
}
function getActivePricing() {
  try {
    return localStorage.activePricing;
  } catch(e) {return false};
}
function askNewPricing() {
  $('#newpricing').modal({onClose: function() {
    console.log('Closing now');
    console.log(getActivePricing());
    if (!getActivePricing()) {
      console.log('No Active Pricing: ' + getActivePricing());
      askNewPricing();
      }
  }});
}

function addRate() {
  var rname= $('#newpricing_name').val();
  if (!rname) {
    humanMsg.displayMsg('Please, specify a good value');
    return;
  }
  llNewPricing(rname, 
    function(ses, recs) {
      console.log('Setting active pricing...');
      setActivePricing(recs.insertId);
      console.log('Closing modal...');
      $.modal.close();
      $.modal.close();
      console.log('Init pricing');
      initPricing();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message);
    });
}


var iPricing= function(pricing) {
  this['pricing']= pricing;

  this['designPrice']= function(price) {
    var sdfrom= strDate(price['dfrom']);
    var sdto= strDate(price['dto']);
    var res= '<td>' + sdfrom + '</td>';
    res+= '<td>' + sdto + '</td>';
    res+= '<td>' + price['price_ro'] + '</td>';
    res+= '<td>' + price['price_bb'] + '</td>';
    res+= '<td>' + price['price_hb'] + '</td>';
    res+= '<td>' + price['price_fb'] + '</td>';
    res+= '<td><a href="javascript:delPricingPeriod(' + price['id'] + ')">Delete</a></td>';
    return '<tr>' + res + '</tr>';
  }

  this['designPeriods']= function() {
    var ap= getActivePricing();
    llLoadPricesPeriods(ap,
      function(ses, recs) {
        console.log('Designing ' + recs.rows.length + ' periods');
        var i, res= '';
        for (i=0;i<recs.rows.length;i++) {
          res+= zakPricing.designPrice(recs.rows.item(i)); 
        }
        $('#defperiods').empty().html(res);
      },
      function(ses, err) {
        humanMsg.displayMsg('Error: ' + err.message);
      });
  }
  this['designMe']= function() {
    var i, res= '';
    var ap= getActivePricing(), p;
    for(i=0;i<zakPricing.pricing.length;i++) {
      p= zakPricing.pricing[i];
      if (p['id'] == ap) {
        res+= '<option selected="selected" value="' + p['id'] + '">' + p['name'] + '</option>';
        $('#price_ro').val(p['price_ro'] || '');
        $('#price_bb').val(p['price_bb'] || '');
        $('#price_fb').val(p['price_fb'] || '');
        $('#price_hb').val(p['price_hb'] || '');
      }
      else
        res+= '<option value="' + p['id'] + '">' + p['name'] + '</option>';
    }
    $('#selplan').empty().html(res);
    zakPricing.designPeriods();
  }
  return this;
}

function changeActivePricing() {
  var splan= $('#selplan').val();
  if (splan == getActivePricing()) return;
  setActivePricing(splan);
  initPricing();
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
  llModPricing(getActivePricing(), prices,
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: '+ err.message, 1);
    });
}

function delPricingPeriod(ppid) {
  llDelPricesPeriod(ppid,
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
      zakPricing.designPeriods();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message);
    });
}

function addPricingPeriod() {
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
  var pdfrom= $('#pdfrom').val();
  var pdto= $('#pdto').val();
  var today= unixDate();
  pdfrom= unixDate(pdfrom);
  pdto= unixDate(pdto);
  if (pdfrom > pdto || pdfrom < today || pdto < today) {
    humanMsg.displayMsg('Please, specify valid dates', 1);
    return;
  }
  prices['dfrom']= pdfrom;
  prices['dto']= pdto;
  llNewPricesPeriod(getActivePricing(), [prices],
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
      zakPricing.designPeriods();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message);
    });
}

function initPricing() {
  llLoadPricing(
    function(ses, recs) {
      if (recs.rows.length == 0) {
        console.log('No pricing!! Ask new');
        askNewPricing();
        return;
      }
      if (!getActivePricing()) {
        setActivePricing(recs.rows.item(0)['id']);
      }
      zakPricing= new iPricing(arrayFromRecords(recs));
      zakPricing.designMe();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error ' + err.message, 1);
    });

}

$(document).ready(function() {
  $('#pdfrom').datepicker({dateFormat: 'dd/mm/yy'});
  $('#pdto').datepicker({dateFormat: 'dd/mm/yy'});
  initPricing();
});
