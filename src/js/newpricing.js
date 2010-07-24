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
      console.log('Pushing');
      console.log(no);
      res.push(copyObject(no));
    }
    else {
      no['del']= 1;
      res.push(copyObject(no));
    }
    console.log('Res Res');
    console.log(res);
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
  console.log('Old newest');
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
      var prices= _decompressPricing(p.prices);
      console.log('Prices');
      console.log(prices);
      var res= '';

      function _gp(rt) {
        return _getRtPricing(prices, rt);
      }

      console.log('Now cycling rtypes');
      for (var i= 0; i< _zakRtypes.length; i++) {
        var rtype= _zakRtypes[i + ''];
        res+= '<tr><td><b>' + rtype.name.substring(0,6) + '</b></td>';
        res+= '<td><input type="text" id="price_' + rtype.id + '" style="width:75px" value="';
        res+= _gp(rtype.id) + '"></input>';
      }
      $('#defprices').empty().html(res);
    });

  llLoadPricesPeriods(getActivePricing(),
    function(ses, recs) {
      var hres= '<th><b>From</b></th><th><b>To</b></th>';
      var dres= '<td><input type="text" id="pdfrom" style="width:75px" value="12/12/2010"></input></td>';
      dres+= '<td><input type="text" id="pdto" style="width:75px" value="14/12/2010"></input></td>';
      for (var z= 0; z< _zakRtypes.length; z++ ) {
        var zt= _zakRtypes[z];
        hres+= '<th><b>' + zt.name.substring(0,6) + '</b></th>';
        dres+= '<td><input type="text" id="pprice_' + zt.id + '" style="width:60px"></input></td>';
      }
      hres+= '<th><b>Save</b></th>';
      dres+= '<td><input type="submit" value="Save" onclick="savePeriodPricing()"></td>';
      $('#lrtypesname').empty().html(hres);
      $('#lrtypesinput').empty().html(dres);

      for (var j= 0; j< recs.rows.length; j++) {
        var pp= recs.rows.item(i);
        var pprices= _decompressPricing(pp.prices);
        var ppres= '<tr><td>' + strDate(pp.dfrom) + '</td><td>' + strDate(pp.dto) + '</td>';
        for (var z= 0; z< _zakRtypes.length; z++ ) {
          ppres+= '<td>' + _getRtPricing(pprices, zt.id) + '</td>';
        }
        ppres+= '</tr>';
      }
      $('#defprices').empty().html(ppres);
    });
}

function saveBasePrices() {
  var prices= {};
  for (var i= 0; i< _zakRtypes.length; i++) {
    var rt= _zakRtypes[i];
    var p= $('#price_' + rt.id).val();
    if (!checkFloat(p)) {
      humanMsg.displayMsg('Please, specify good values (use the "." for decimal)', 1);
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
  var prices= {};
  var dfrom= $('#pdfrom').val();
  var dto= $('#pdto').val();
  console.log(dfrom);
  console.log(dto);
  for (var i= 0; i< _zakRtypes.length; i++) {
    var rt= _zakRtypes[i];
    var p= $('#pprice_' + rt.id).val();
    if (!checkFloat(p)) {
      humanMsg.displayMsg('Please, specify good values (use the "." for decimal)', 1);
      return;
    }
    prices[rt.id + '']= p;
  }
  console.log(prices);
  prices.dfrom= unixDate(dfrom);
  prices.dto= unixDate(dto);
  var ap= getActivePricing();
  /* we have dfrom,dto,prices */
  llLoadPricesPeriods(ap,
    function(ses, recs) {
      if (recs.rows.length == 0) 
        var saveprices= [prices];
      else {
        /* let's check intersections */
        var intersections= new Array();
        for (var i= 0; i< recs.rows.length; i++) {
          var ppp= recs.rows.item(i);
          if (ppp['dto'] >= dfrom && ppp['dfrom'] <= dto) {
            intersections.push(ppp);
          }
        }
        if (intersections.length == 0) {
          var saveprices= [prices];
        } else {
          var res= [prices], tres, j;
          for (var i=0; i<intersections.length;i++) {
            var pint= intersections[i];
            tres= mergePeriods(pint, prices);
            for (j=0;j<tres.length;j++) {
              res.push(tres[j]);
            }
          }
        }
        var saveprices= res;
      }

      console.log('Final');
      console.log(saveprices);
      llNewPricesPeriod(ap, saveprices,
        function(ses, recs) {
          humanMsg.displayMsg('Sounds good');
          designPricing();
          return;
        },
        function(ses, err) {
          humanMsg.displayMsg('Error there: ' + err.message);
        });
      return;
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
