_zakRtypes= [];

function mergePeriods(oldp, newp) {
  var os= oldp['dfrom'];
  var oe= oldp['dto'];
  var ns= newp['dfrom'];
  var ne= newp['dto'];

  var res= [];
  var no;
  /* the old period contains the new */
  if (os <= ns && ne <= oe) { 
    no= copyObject(oldp);
    no['dto']= ns - 86400;
    if (no['dto'] > no['dfrom']) 
      res.push(copyObject(no));
    else { 
      no['del']= 1;
      res.push(copyObject(no));
    }
    no= copyObject(oldp);
    no['dfrom']= newp['dto'] + 86400;
    if (no['dto'] > no['dfrom']) {
      delete no.id;
      res.push(copyObject(no));
    }
    else {
      no['del']= 1;
      res.push(copyObject(no));
    }
    return res;
  }

  /* the new period contains the old */
  if (ns <= os && oe <= ne) {
    no= copyObject(oldp);
    no['del']= 1;
    res.push(no);
    return res;
  }

  /* pure intersection */
  /* old older */
  if (os < ns) {
    no= copyObject(oldp);
    no['dto']= newp['dfrom'] - 86400;
    if (! no['dto'] > no['dfrom'])
      no['del']= 1;
    res.push(no);
    return res;
  }

  /* old newest */
  no= copyObject(oldp);
  no['dfrom']= newp['dto'] + 86400;
  if (! no['dto'] > no['dfrom']) 
    no['del']= 1;
  res.push(no);
  return res;
}

function _decompressPricing(prices) {
  try {
    return JSON.parse(prices);
  } catch(e) {return -1};
}

function _getRtPricing(prices, rt) {
  try {
    var res= parseFloat(prices[rt+'']);
    if (!res) return 0.0;
    return res.toFixed(2);
  } catch(e) {return 0.0};
}

function designPricingPeriods() {
  llLoadPricesPeriods(getActivePricing(),
    function(ses, recs) {
      var ppres= '';
      for (var j= 0; j< recs.rows.length; j++) {
        var pp= recs.rows.item(j);
        var pprices= _decompressPricing(pp.prices);
        ppres+= '<tr><td>' + strDate(pp.dfrom) + '</td><td>' + strDate(pp.dto) + '</td>';
        for (var z= 0; z< _zakRtypes.length; z++ ) {
          ppres+= '<td>' + _getRtPricing(pprices, _zakRtypes[z].id) + '</td>';
        }
        ppres+= '<td><input type="submit" value="'+_('Delete')+'" onclick="delPricingPeriod(' + pp.id + ')"/></td></tr>';
      }
      $('#defperiods').empty().html(ppres);
    });

    var hres= '<th><b>From</b></th><th><b>To</b></th>';
    var dres= '<td><input type="text" id="pdfrom" style="width:75px"></input></td>';
    dres+= '<td><input type="text" id="pdto" style="width:75px"></input></td>';
    for (var z= 0; z< _zakRtypes.length; z++ ) {
      var zt= _zakRtypes[z];
      hres+= '<th><b>' + zt.name.substring(0,6) + '</b></th>';
      dres+= '<td><input type="text" id="pprice_' + zt.id + '" style="width:60px"></input></td>';
    }
    dres+= '<td><input type="submit" value="Save" onclick="savePeriodPricing()"></td>';
    $('#lrtypesname').empty().html(hres + '<th><b>'+_('Save')+'</b></th>');
    $('#lrtypesperiodsname').empty().html(hres + '<th><b>'+_('Delete')+'</b></th>');
    $('#lrtypesinput').empty().html(dres);
    $('#pdfrom').datepicker({dateFormat: 'dd/mm/yy'});
    $('#pdto').datepicker({dateFormat: 'dd/mm/yy'});
}

function designPricing() {

  /* cmb pricing */
  llLoadPricings(function(ses, recs) {
    var rres= '';
    for (var i= 0; i< recs.rows.length; i++) {
      var p= recs.rows.item(i);
      rres+= '<option value="' + p.id + '">' + p.name + '</option>';
    }
    $('#selplan').empty().html(rres);
    $('#selplan').val(getActivePricing());
  }, function(ses, err) {humanMsg.displayMsg('Error there: '+ err.message)});

  /* base pricing */
  llLoadPricing(getActivePricing(), 
    function(ses, recs) {
      var p= recs.rows.item(0);
      var prices= _decompressPricing(p.prices);
      var res= '';

      function _gp(rt) {
        return _getRtPricing(prices, rt);
      }

      for (var i= 0; i< _zakRtypes.length; i++) {
        var rtype= _zakRtypes[i + ''];
        res+= '<tr><td><b>' + rtype.name.substring(0,6) + '</b></td>';
        res+= '<td><input type="text" id="price_' + rtype.id + '" style="width:75px" value="';
        res+= _gp(rtype.id) + '"></input>';
      }
      $('#defprices').empty().html(res);
    });
  designPricingPeriods();
}

function saveBasePrices() {
  var prices= {};
  for (var i= 0; i< _zakRtypes.length; i++) {
    var rt= _zakRtypes[i];
    var p= $('#price_' + rt.id).val();
    if (!checkFloat(p)) {
      humanMsg.displayMsg(_('Specify good values: for decimal values, use the DOT'), 1);
      return;
    }
    prices[rt.id]= p;
  }
  prices= JSON.stringify(prices);
  llModPricing(getActivePricing(), {prices: prices}, 
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
    });
}

function savePeriodPricing() {
  if (_zakRtypes.length == 0) {
    humanMsg.displayMsg('You have no room type yet');
    return;
  }
  var dfrom= $('#pdfrom').val();
  var dto= $('#pdto').val();
  if (!dfrom || !dto) {
    humanMsg.displayMsg(_('Please, specify valid dates'), 1);
    return;
  }
  try {
    if (unixDate(dto) < unixDate(dfrom)) {
      humanMsg.displayMsg(_('Please, specify valid dates'), 1);
      return;
    }
  } catch(e) {
    humanMsg.displayMsg(_('Please, specify valid dates'), 1);
    return;
  }
  var prices= {};
  for (var i= 0; i< _zakRtypes.length; i++) {
    var rt= _zakRtypes[i];
    var p= $('#pprice_' + rt.id).val();
    if (!checkFloat(p)) {
      humanMsg.displayMsg(_('Specify good values: for decimal values, use the DOT'), 1);
      return;
    }
    prices[rt.id + '']= p;
  }
  var params= {};
  params.dfrom= unixDate(dfrom);
  params.dto= unixDate(dto);
  params.prices= JSON.stringify(prices);
  var ap= getActivePricing();
  /* we have dfrom,dto,prices */
  llLoadPricesPeriods(ap,
    function(ses, recs) {
      if (recs.rows.length == 0) 
        var saveprices= [params];
      else {
        /* let's check intersections */
        var intersections= new Array();
        for (var i= 0; i< recs.rows.length; i++) {
          var ppp= recs.rows.item(i);
          if (parseInt(ppp.dto) >= parseInt(unixDate(dfrom)) && 
              parseInt(ppp.dfrom) <= parseInt(unixDate(dto))) {
            intersections.push(ppp);
          }
        }
        if (intersections.length == 0) {
          var saveprices= [params];
        } else {
          var res= [params], tres, j;
          for (var i=0; i<intersections.length;i++) {
            var pint= intersections[i];
            tres= mergePeriods(pint, params);
            for (j=0;j<tres.length;j++) {
              res.push(tres[j]);
            }
          }
          var saveprices= res;
        }
      }

      llNewPricesPeriod(ap, saveprices,
        function(ses, recs) {
          humanMsg.displayMsg('Sounds good');
          designPricing();
          return;
        },
        function(ses, err) {
          humanMsg.displayMsg('Error there: ' + err.message, 1);
        });
      return;
    });
}

function delPricingPeriod(pid) {
  llDelPricesPeriod(pid,
    function(ses, recs) {
      designPricingPeriods();
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message, 1);
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
    } else $.modal.close();
  }});
}

function addPricing() {
  var rname= $('#newpricing_name').val();
  if (!rname) {
    humanMsg.displayMsg(_('Please, specify a valid name'));
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

function changeActivePricing() {
  var splan= $('#selplan').val();
  if (splan == getActivePricing()) return;
  setActivePricing(splan);
  designPricing();
}

function initPricing() {
  _zakRtypes= [];
  llGetRoomTypes(function(ses, recs) {
    for (var i= 0; i< recs.rows.length; i++) {
      var rt= recs.rows.item(i);
      _zakRtypes.push(rt);
    }
    llLoadPricings(function(ses, recs) {
      if (recs.rows.length != 0) {
        var ap= getActivePricing();
        if (!ap) 
          setActivePricing(recs.rows.item(0).id);
        designPricing();
        return;
      } else {
        llNewPricing('Default', function(ses, recs) {
          initPricing();
        }, function(ses, err) {humanMsg.displayMsg('Error there: ' + err.message, 1);});
      }
    });
  }, function(ses, err) {
    humanMsg.displayMsg('Error there: ' + err.message);
  });
}

$(document).ready(function() {
  initPricing();
});
