/* 
 * localStorage.editOccupancyOid
 * localStorage.editOccupancyRid
 */

zakEditReservation= false;
zakRoomsSetups= new Array();
_tempChildren= new Array();
_tempExtras= {};
_zakYourVat= false;
_tempPricing= {};
_tempTotal= 0.0;

function choosePricingApplication() {
  var v= $('#choose_app').val();
  if (!v) {
    $('#apply_pricing').hide();
    $('#apply_filters').hide();
  }
  if (v == 'pricing') {
    llLoadPricings(function(ses, recs) {
      if (recs.rows.length > 0) {
        $('#apply_pricing').show();
        $('#apply_filters').hide();
      } else {
        humanMsg.displayMsg('There is no pricing to apply. Insert a new pricing before');
        $('#choose_app').val('');
        $('#apply_pricing').hide();
        $('#apply_filters').hide();
      }
    });
  }
  if (v == 'filter') {
    $('#apply_pricing').hide();
    $('#apply_filters').show();
  }
}

function getResExtras() {
  try {
    return JSON.parse(zakEditReservation.extras);
  } catch(e) {return []};
}

function getResMeals() {
  var meals= zakEditReservation.meals;
  if (!meals) return {};
  try {
    meals= JSON.parse(meals);
    if (!meals) meals= {};
  } catch(e) {meals= {}};
  return meals;
}

function designOccupancy() {
  llLoadOccupancy(localStorage.editOccupancyOid, function(ses, recs) {
    _designOccupancy(recs.rows.item(0));
  });
}

function designChildren() {
  var res= '';
  $('.rchildren').remove();
  for (var i= 0; i< _tempChildren.length; i++) {
    var child= _tempChildren[i];
    var age= child.age;
    res+= '<tr class="rchildren"><td></td><td>Age: ' + age + '</td>'; 
    res+= '<td><b><a href="javascript:delChild(' + age +','+ i + ')">Delete</a></b></td></tr>'; 
  }
  $('#table_occupancy').append(res);
  $('#childrenCounter').val(_tempChildren.length);
}

function delChild(age, j) {
  var newchi= new Array();
  for (var i= 0; i< _tempChildren.length; i++)
    if (i!=j) newchi.push(_tempChildren[i]);
  _tempChildren= newchi;
  designChildren();
}

function _designOccupancy(aocc) {
  $('#oremarks').val(aocc.remarks) || '';
  $('#selOccupancy').val(aocc.id_room);
  $('#selectSetup').val(aocc.id_room_setup || '');
  $('#ocustomer').val(aocc.customer || '');

  var occupancy= aocc.occupancy;
  if (!occupancy) {
    $('#adults').val(1);
    $('#childrenCounter').val(0);
    $('.rchildren').remove();
  } else {
    occupancy= JSON.parse(occupancy);
    var adults= occupancy.adults;
    var children= occupancy.children;
    $('#childrenCounter').val(children.length);
    $('#adults').val(adults);
    _tempChildren= children;
    designChildren();
  }
}

function designExtras(where) {
  var extras= getResExtras();
  if (extras.length == 0) {
    $(where || '#assignedExtras').empty();
    return;
  }
  var res= '<table class="assignedExtras">', e;
  for (var i= 0; i< extras.length; i++) {
    e= extras[i];
    if (!where) {
      res+= '<tr><td><b id="extra_id_' + e.id +'">' + e.name + '</b>:</td>'; 
      res+= '<td><input class="extraHow" type="text" id="extra_how_' + e['id'];
      res+= '" value="' + e['how'] + '"></input></td>'; 
      res+= '<td><input class="extraCost" type="text" id="extra_cost_' + e['id'];
      res+= '" value="' + parseFloat(e['cost']).toFixed(2) + '"></input></td>'; 
      res+= '<td><a href="javascript:removeAssignedExtra(' + e['id'] + ')"><b>Delete</b></a></td>';
      res+= '</tr>';
    } else {
      res+= '<tr><th>Extra</th><th>Qty</th><th>Price</th></tr>';
      res+= '<tr><td align="center">' + e.name + '</td>'; 
      res+= '<td align="center">' + e.how + '</td>';
      res+= '<td align="center">' + parseFloat(e['cost']).toFixed(2) + '</td>';
      res+= '</tr>';
    }
    _tempTotal+= parseFloat(e['cost']);
  }
  if (!where) {
    res+= '<tr><td colspan="4" style="text-align:center">';
    res+= '<input type="submit" value="Update extras" onclick="saveUpdatedExtras()"></input></td></tr>';
  }
  res+= '</table>';
  $(where || '#assignedExtras').html(res);
}

function loadRoomPricing(rid, prid) {
  var prices= _tempPricing[prid];
  if (!prices) {
    llGetDatedPricing(zakEditReservation.dfrom, zakEditReservation.dto, 1,
      function(pps) {
        return 
      }, 
      function(ses, err) {
        humanMsg.displayMsg('Bad error there: '+ err.message);
      });

  }
}

function getRoomPricing(room, prid, rprices) {
  var rid= room.id;
  var roomp= rprices[rid];
  if (roomp) {
    return roomp;
  }
  if (!prid) {
    var prices= [];
    for (var i= 0; i< diffDateDays(zakEditReservation.dfrom, zakEditReservation.dto); i++) {
      prices.push(0.0);
    }
    return prices;
  }
  var cpricing= _tempPricing[prid];
  var rt= room.id_room_type;
  var res= new Array();
  for (var i= 0; i< diffDateDays(zakEditReservation.dfrom, zakEditReservation.dto); i++) {
    var dprice= cpricing[i];
    try {
      var p= dprice[rt + ''];
    } catch(e) {var p= 0.0};
    if (!checkFloat(p)) p= 0.0;
    res.push(p);
  }
  return res;
}

function _desingPrices(prices, where, readonly) {
  var res= '<thead class="pricing"><tr><th>Day/Room</th>';
  for (var i= 0; i< zakEditReservation.rooms.length; i++) {
    if (readonly)
      var rcode= zakEditReservation.rooms[i].name;
    else
      var rcode= zakEditReservation.rooms[i].code;
    res+= '<th>'+rcode+'</th>';
  }
  res+= '</thead>';

  var icycle= diffDateDays(zakEditReservation.dfrom, zakEditReservation.dto);
  function _strDay(dayidx) {
    var d= unixDate(zakEditReservation.dfrom) + (86400 * parseInt(dayidx));
    return  strDate(d, 'd/m');
  }
  function _strPri(dayidx, rid) {
    try {
      return prices[rid][dayidx];
    } catch(e) {console.log('Pricing error: ' + e.message); return 0.0};
  }

  function _inpRoom(dayidx, rid) {
    var sty= ' style="width:50px" ';
    if (readonly)
      return '<td align="center">' + _strPri(i, rid) + ' ' + getCurrency() + '</td>';
    else {
      var iid= ' id="price_' + rid + '_' + dayidx + '" ';
      var spri= parseFloat(_strPri(i, rid));
      var onc= ' onchange="computeRoomsAmount(' + rid + ')"' ;
      _tempTotal+= spri;
      return '<td><input ' + iid + sty + onc + 'type="text" value="' + spri + '"></input></td>';
    }
  }

  var cmbdaymeals= '';
  for (var i= 0; i< icycle; i++) {
    var std= _strDay(i);
    var sv= parseInt(zakEditReservation.dfrom) + (86400 * i);
    tres= '<tr><td align="center">' + std + '</td>';
    cmbdaymeals+= '<option value="' + sv + '">' + std + '</option>';
    for (var j= 0; j< zakEditReservation.rooms.length; j++) {
      var rid= zakEditReservation.rooms[j].id;
      tres+= _inpRoom(i, rid);
    }
    tres+= '</tr>';
    res+= tres;
  }
  if (!readonly) {
    $('#cmbdaymeals').html('<option value="" selected="selected">Each day</option>' + cmbdaymeals);
    res+= '<tr><td><b id="total_sum">...</b></td>';
    for (var i= 0; i< zakEditReservation.rooms.length; i++) {
      var rid= zakEditReservation.rooms[i].id;
      res+= '<td><b id="partial_sum_' + rid + '">...</b></td>';
    }
  }
  res+= '</tr>';
  $(where || '#tablepricing').html(res);
  computeRoomsAmount();
}

function computeRoomsAmount(onlyrid) {
  var icycle= diffDateDays(zakEditReservation.dfrom, zakEditReservation.dto);
  for (var i= 0; i< zakEditReservation.rooms.length; i++) {
    var rid= zakEditReservation.rooms[i].id;
    if (onlyrid && onlyrid != rid) continue;
    var pcount= 0.0;
    for (var j= 0; j< icycle; j++) {
      var s= '#price_' + rid + '_' + j;
      var p= $(s).val();
      if (!p) {
        humanMsg.displayMsg('Please, specify good valus (use the . for decimal values)', 1);
        return;
      }
      p= parseFloat(p);
      if (!checkFloat(p)) {
        humanMsg.displayMsg('Please, specify good valus (use the . for decimal values)', 1);
        return;
      }
      pcount+= p;
      $('#partial_sum_' + rid).html(pcount.toFixed(2));
    }
  }
  var tcount= 0.0;
  for (var i= 0; i< zakEditReservation.rooms.length; i++) {
    var rid= zakEditReservation.rooms[i].id;
    var partial= $('#partial_sum_' + rid).html();
    tcount+= parseFloat(partial);
  }
  $('#total_sum').html(tcount.toFixed(2));
}

function changePricing() {
  designPrices($('#cmbpricing').val(), $('#cmbPricingRoom').val());
}

function changeOccupancy() {
  localStorage.editOccupancyOid= $('#selOccupancy').val();
  designOccupancy();
}

function designPrices(prid, onlyroom, where, readonly) {
  /* make sure pricing info is loaded */
  console.log('Writing prices: prid= ' + prid + ', onlyroom: ' + onlyroom);
  if (prid && !_tempPricing[prid]) {
    llGetDatedPricing(prid, zakEditReservation.dfrom, zakEditReservation.dto, 1,
      function(pps) {
        _tempPricing[prid]= pps;
        designPrices(prid, onlyroom, where, readonly);
      }, 
      function(ses, err) {
        humanMsg.displayMsg('Bad error there: '+ err.message);
      });
    return;
  }

  /* let's go */
  try {
    /* force id_pricing */
    if (prid) rprices= -1;
    else var rprices= JSON.parse(zakEditReservation.custom_pricing);
  } catch(e) {var rprices= -1};
  var res= {};
  for (var i= 0; i< zakEditReservation.rooms.length; i++) {
    var room= zakEditReservation.rooms[i];
    /* Maintain edited prices for this room */
    if (onlyroom && onlyroom != room.id) {
      var roomprices= new Array();
      for (j= 0; j< diffDateDays(zakEditReservation.dfrom, zakEditReservation.dto); j++) {
        roomprices.push($('#price_' + room.id + '_' +j).val());
      }
      res[room.id]= roomprices;
    } else {
      var roomprices= getRoomPricing(room, prid, rprices);
      res[room.id]= roomprices;
    }
  }
  _desingPrices(res, where, readonly);
}

function designCmbPricing() {
  llLoadPricings(function(ses, recs) {
    var res= '';
    for (var i= 0; i< recs.rows.length; i++) {
      var p= recs.rows.item(i);
      res+= '<option value="' + p.id + '">'+p.name+ '</option>';
    }
    $('#cmbpricing').html(res);
  });
  var rres= '<option value="">Alls</option>';
  for (var j= 0; j< zakEditReservation.rooms.length; j++) {
    var rr= zakEditReservation.rooms[j];
    rres+= '<option value="' + rr.id + '">' + rr.name + '</option>';
  }
  $('.cmbPricingRoom').html(rres);
}

function designMeals() {
  llGetMeals(false, function(ses, recs) {
    var res= '';
    for (var i= 0; i< recs.rows.length; i++) {
      var m= recs.rows.item(i);
      res+= '<option value="' + m.id + '">' + m.name + '</option>';  
    }
    $('#cmbmeal').html(res);
  });
}

function designMain() {
  $('#rremarks').val(zakEditReservation.remarks || '');
  designCmbPricing();
  designExtras();
  designPrices();
  designVariations();
  designMeals();
  designMealTables();
  designCustomers();
}

function designVariations() {
  llGetVariations(false, function(ses, recs) {
    var res= '';
    for (var i= 0; i< recs.rows.length; i++) {
      var v= recs.rows.item(i);
      res+= '<option value="' + v.id + '">' + v.name + '</option>';
    }
    $('#cmbalter').html(res);
  });
}

function subTableMeals(meals, day, readonly) {
  var sday= strDate(parseInt(day), 'd/m');
  var res= '';
  for (var i= 0; i< meals.length; i++) {
    res+= '<tr><td>' + sday + '</td>';
    var meal= meals[i];
    res+= '<td>' + meal.name + '</td>';

    var mid= day + '_' + meal.id;

    if (!readonly) {
      res+= '<td><input id="mhow_' + mid + '" type="text" ';
      res+= 'style="width:40px" value="' + meal.how + '"></input></td>';

      res+= '<td><input id="mprice_' + mid + '" type="text" ';
      res+= 'style="width:40px" value="' + meal.cprice + '"></input></td>';

      res+= '<td><input type="submit" value="Delete" onclick="removeMeal(' + day + ','+ meal.id + ')"></input></td>';
    } else {
      res+= '<td align="center">' + meal.how + '</td>';
      res+= '<td align="center">' + meal.cprice + '</td>';
    }
    _tempTotal+= parseFloat(meal.cprice);

    res+= '</tr>';
  }
  return res;
}

function designMealTables(where, wherediv) {
  var meals= getResMeals();
  if (!where) 
    var res= '<thead class="pricing"><tr><th>Day</th><th>Meal</th><th>How</th><th>Price</th><th>Del</th></tr></thead>';
  else
    var res= '<thead class="pricing"><tr><th>Day</th><th>Meal</th><th>How</th><th>Price</th></tr></thead>';
  console.log('meals: ');
  gigi= meals;
  something= false;
  for (var k in meals) {
    something= true;
    res+= subTableMeals(meals[k], k, where);
  }
  if (!where)
    res+= '<tr><td colspan="5"><input type="submit" value="Update" onclick="updateMeals()"></input></tr>';
  $(where || '#tablemeals').html(res);
  if (something) $(wherediv || '#meals_div').show();
  else $(wherediv || '#meals_div').hide();
}

function designReservation(noOccupancy) {
  llGetReservationInvoice(localStorage.editOccupancyRid,
    function(ses, recs) {
      if (recs.rows.length > 0) 
        $('#iviewer').show();
      else
        $('#ibuilder').show();
    });
  llLoadRoomSetups(function(ses, recs) {
    for (var i= 0; i< recs.rows.length; i++ ) 
      zakRoomsSetups.push(recs.rows.item(i));

    var res= '<option value="">--</option>';
    for (var j= 0; j< zakRoomsSetups.length; j++) {
      var z= zakRoomsSetups[j];
      res+= '<option value="' + z.id + '">' + z.name + '</option>';
    }
    $('#selectSetup').empty().html(res);

    llLoadExtras(function(ses, recs) {
      var eres= '';
      for (var k= 0; k< recs.rows.length; k++) {
        var e= recs.rows.item(k);
        eres+= '<option value="' + e.id + '">' + e.name + '</option>';
        _tempExtras[e.id]= {cost: e.cost, perday: e.perday, name: e.name, vat: e.vat};
      }
      $('#selectExtra').empty().html(eres);
    });

    var r= llGetReservationFromRid(localStorage.editOccupancyRid,
      function(reservation) {
        zakEditReservation= reservation;

        var rooms= zakEditReservation.rooms;
        var srooms= '';
        for (var j= 0; j< rooms.length; j++) {
          var room= rooms[j];
          srooms+= '<option value="' + room.id + '">' + room.name + '</option>';
        }
        $('#selOccupancy').empty().html(srooms);

        designMain();
        if (!noOccupancy) 
          designOccupancy();
      }, function(ses, err) {
        humanMsg.displayMsg('Error there: ' + err.message, 1);
      });
  });
}

function saveOccupancy() {
  var ocust= $('#ocustomer').val();
  var ads= $('#adults').val();
  var occ= JSON.stringify({adults: ads, children: _tempChildren});
  llModOccupancy(localStorage.editOccupancyOid, {occupancy: occ, customer: ocust},
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
      designOccupancy();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
    });
}

function saveRooms() {
  var rmrks= $('#oremarks').val();
  var rsetup= $('#selectSetup').val() || '';
  /*var ocust= $('#ocustomer').val() || '';*/
  /*if (!ocust) {*/
  /*humanMsg.displayMsg('Please, insert a valid customer name', 1);*/
  /*return;*/
  /*}*/
  llModOccupancy(localStorage.editOccupancyOid, {remarks: rmrks, id_room_setup: rsetup},
    function(ses, recs) {
      designOccupancy();
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message, 1);
    });
}

function askNewRSetup() {
  var el= $('#addRSetupButton');
  var x= el.offset().left;
  var y= el.offset().top;
  $('#rsetup_div').modal({position: [y,x]});
}
function addRSetup() {
  var rsname= $('#rsetup_name').val();
  llAddRSetup(rsname, localStorage.editOccupancyOid,
    function(ses, recs) {
      $.modal.close();
      humanMsg.displayMsg('Sounds good');
      designReservation();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message, 1);
    });
}

function askChildren() {
  var el= $('#addChildrenButton');
  var x= el.offset().left;
  var y= el.offset().top;
  $('#children_div').modal({position: [y,x]});
}
function addChildren() {
  var age= $('#children_age').val();
  if (parseInt(age) != age) {
    humanMsg.displayMsg('Please, specify good values', 1);
    return;
  }
  _tempChildren.push({age: age});
  designChildren();
  $.modal.close();
}

function askExtra() {
  if (!_zakYourVat) { 
    llGetPropertySettings(getActiveProperty(),
      function(ses, recs, sets) {
      _zakYourVat= sets.vatSettingsPerc;
      $('.vatsettings').val(_zakYourVat);
      askExtra();
      });
    return;
  }
  var el= $('#addExtraButton');
  var x= el.offset().left;
  var y= el.offset().top;
  $('#addextra_div').modal({position: [y,x]});
}

function askVariation() {
  $('#vapply').hide();
  $('.vsave').hide();
  $('#vtype').val(1);
  $('#vpercsym').show();
  $('#addvariation_div').modal();
}

function writeVariationRoom(vt, vv, rid) {
  var icycle= diffDateDays(zakEditReservation.dfrom, zakEditReservation.dto);
  function _apply(p) {
    if (vt == 1) 
      return parseFloat(p) * (100.00 + parseFloat(vv)) / 100.0;
    if (vt === 2) 
      return parseFloat(p) + parseFloat(vv);
    return parseFloat(p) + (parseFloat(vv) / icycle);
  }
  for (var i= 0; i< icycle; i++) {
    var pp= $('#price_' + rid + '_' + i).val();
    $('#price_' + rid + '_' + i).val(_apply(pp).toFixed(2));
  }
}

function writeVariationMsg(vt, vv, rooms) {
  var msgVariation= '';
  try {
    var now= $.datepicker.formatDate('D M yy', new Date());
    var stype, srooms= '?';
    if (vt == 1) stype= 'Percentage';
    else if (vt == 2) stype= 'Fixed (daily)';
    else stype= 'Fixed';
    if (!rooms) srooms= 'Alls';
    else {
      for (var i= 0; i< zakEditReservation.rooms.length; i++) {
        if (zakEditReservation.rooms[i].id == rooms)
          srooms= zakEditReservation.rooms[i].code;
      }
    }
    msgVariation= '[ZaK ' + now + '] I applied the following variation: ';
    msgVariation+= 'Type: ' + stype + ', Value: ' + vv;
    msgVariation+= ', Rooms: ' + srooms;
  } catch(e) {console.log(e); msgVariation= ''};
  return msgVariation;
}

function writeVariation(vt, vv, rooms) {
  console.log('writing variation: vt: ' + vt + ', vv: ' + vv + ', rooms: ' + rooms);
  var msg= writeVariationMsg(vt, vv, rooms);
  console.log('Message: ' + msg);
  if (rooms) 
    writeVariationRoom(vt, vv, rooms);
  else {
    for (var i= 0; i< zakEditReservation.rooms.length; i++) {
      var rid= zakEditReservation.rooms[i].id;
      writeVariationRoom(vt, vv, rid);
    }
  }
  computeRoomsAmount();
  var rm= $('#rremarks').val();
  console.log(msg);
  rm+= '\n\n' + msg;
  llModReservation(localStorage.editOccupancyRid, {remarks: rm},
    function(ses, recs) {
      $('#rremarks').val(rm);
    },
    function(ses, err) {
    });
}

function askMeal() {
  $('#addmeal_div').modal();
}

function saveMeal() {
  var mname= $('#mname').val();
  var mtype= $('#mtype').val();
  var mprice= $('#mprice').val();
  var mvat= $('#mvat').val();
  if (!checkFloat(mvat) || !checkFloat(mprice) || !mname) {
    humanMsg.displayMsg('Please, specify good values');
    return;
  }
  llNewMeal(mname, mprice, mtype, mvat, function(ses, recs) {
    designMeals();
    $.modal.close();
    }, function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
    });
}

function addMeal() {
  console.log('Adding meal');
  var mid= $('#cmbmeal').val();
  if (!mid) {
    humanMsg.displayMsg('Select a valid meal or define a new one');
    return;
  }
  var how= $('#howmeals').val();
  var day= $('#cmbdaymeals').val();
  var meals= getResMeals();
  console.log(meals);
  console.log(day);

  console.log('Now adding meal');

  llGetMeals(mid, function(ses, recs) {
    var omeal= recs.rows.item(0);
    /* add meal for a unique day */

    function _am(when) {
      console.log('Am: ' + when);
      var mealday= meals[when + ''];

      /* no meal for this day, simply add */
      if (!mealday) {
        var newmeal= jQuery.extend(true, {}, omeal);
        newmeal.how= how;
        newmeal.cprice= parseInt(how) * parseFloat(newmeal.price);
        meals[when + '']= [newmeal];
      } else {
        /* merge meals */
        var found= false;
        for (var j= 0; j< mealday.length; j++) {
          if (mealday[j].id == omeal.id) {
            found= true;
            var oldmealday= mealday[j];
            oldmealday.how= parseFloat(oldmealday.how) + parseInt(how);
            oldmealday.cprice= parseFloat(oldmealday.cprice) + parseFloat(omeal.price);
            break;
          }
        }
        if (!found) {
          var newmeal= jQuery.extend(true, {}, omeal);
          newmeal.how= how;
          newmeal.cprice= parseInt(how) * parseFloat(newmeal.price);
          meals[when + ''].push(newmeal);
        }
      }
    }

    if (day) {
      _am(day);
    } else {
      var now= zakEditReservation.dfrom;
      for (var i= 0; i< diffDateDays(zakEditReservation.dfrom, zakEditReservation.dto); i++) {
        _am(parseInt(zakEditReservation.dfrom) + (86400 * i));
      }
    }

    llModReservation(localStorage.editOccupancyRid, {meals: JSON.stringify(meals)},
      function(ses, recs) {
        humanMsg.displayMsg('Sounds good');
        designReservation(1);
      },
      function(ses, err) {
        humanMsg.displayMsg('Error there: ' + err.message);
      });
  });
}

function updateMeals() {
  var meals= getResMeals();
  for (var day in meals) {
    for (i= 0; i< meals[day].length; i++) {
      var meal= meals[day][i];
      var how= $('#mhow_' + day + '_' + meal.id).val();
      var pri= $('#mprice_' + day + '_' + meal.id).val();
      if (!checkFloat(pri) || parseInt(how) != how) {
        console.log(how);
        console.log(pri);
        humanMsg.displayMsg('Please, specify good values');
        return;
      }
      meal.cprice= pri;
      meal.how= how;
    }
  }
  llModReservation(localStorage.editOccupancyRid, {meals: JSON.stringify(meals)},
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
      designReservation(1);
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
    });
}

function removeMeal(day, mid) {
  var meals= getResMeals();
  var newmeals= {}
  for (var k in meals) {
    if (day !=  k) {
      newmeals[k]= meals[k];
      continue;
    }
    var lmeals= [];
    for (var i= 0; i< meals[k].length; i++) {
      var omeal= meals[k][i];
      if (omeal.id != mid) lmeals.push(omeal);
    }
    newmeals[k]= lmeals;
  }
  console.log('New meals');
  console.log(meals);

  llModReservation(localStorage.editOccupancyRid, {meals: JSON.stringify(newmeals)},
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
      designReservation(1);
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
    });
}

function changeVtype() {
  if ($('#vtype').val() == 1)
    $('#vpercsym').show();
  else
    $('#vpercsym').hide();
}

function stepSaveApplyVariation() {
  $('#vdecide').hide();
  $('#vsave').show();
  $('#vapply').show();
  $('#vsaveapply').show();
}

function stepSaveVariation() {
  $('#vdecide').hide();
  $('#vsave').show();
  $('#vsavesave').show();
}

function stepApplyVariation() {
  $('#vdecide').hide();
  $('#vapply').show();
  $('#vapplyapply').show();
}

function applyVariation() {
  var vt= $('#vtype').val();
  var vv= $('#vvalue').val();
  if (!checkFloat(vv)) {
    humanMsg.displayMsg('Specify a good variation value before');
    return;
  }
  var rooms= $('#vrooms').val();
  $.modal.close();
  writeVariation(vt, vv, rooms);
}

function saveVariation() {
  var vt= $('#vtype').val();
  var vv= $('#vvalue').val();
  if (!checkFloat(vv)) {
    humanMsg.displayMsg('Specify a good variation value before');
    return;
  }
  var vn= $('#vname').val();
  if (!vn) {
    humanMsg.displayMsg('Specify a good name to save it!');
    return;
  }
  llNewVariation(vt, vv, vn,
    function(ses, recs) {
      designVariations();
      humanMsg.displayMsg('Sounds good');
      $.modal.close();
    }, function(ses, err) {
      humanMsg.displayMsg('Error there: '+ err.message, 1);
    });
}

function saveApplyVariation() {
  var vt= $('#vtype').val();
  var vv= $('#vvalue').val();
  if (!checkFloat(vv)) {
    humanMsg.displayMsg('Specify a good variation value before');
    return;
  }
  var vn= $('#vname').val();
  if (!vn) {
    humanMsg.displayMsg('Specify a good name to save it!');
    return;
  }
  llNewVariation(vt, vv, vn,
    function(ses, recs) {
      designVariations();
      var rooms= $('#vrooms').val();
      writeVariation(vt, vv, rooms);
      $.modal.close();
    }, function(ses, err) {
      humanMsg.displayMsg('Error there: '+ err.message, 1);
    });
}

function applyFilter() {
  var vt= $('#cmbalter').val();
  if (!vt) return;
  var rooms= $('#cmbAlterRoom').val();
  llGetVariations(vt, function(ses, recs) {
    var v= recs.rows.item(0);
    vt= v.vtype;
    vv= v.value;
    writeVariation(vt, vv, rooms);
  });
}

function saveExtra() {
  var ename= $('#extra_name').val();
  var ecost= $('#extra_cost').val();
  var evat= $('#extra_vat').val();
  if (!ename || !checkFloat(ecost) || !checkFloat(evat)) {
    humanMsg.displayMsg('Please, specify good values (decimal values? use the dot [.])');
    return;
  }
  var eperday= $('#extra_perday').val();
  var how= $('#extra_how').val() || 1;
  if (eperday == 0 || !eperday) var atotal= ecost;
  else {
    console.log('Eperday');
    console.log(eperday);
    var n= diffDateDays(zakEditReservation.dfrom, zakEditReservation.dto);
    var atotal= parseFloat(ecost) * parseInt(n);
  }
  atotal*= parseInt(how);
  var aextras= getResExtras();
  console.log('Atotal: ' + atotal);
  llAddExtra(localStorage.editOccupancyRid, ename, ecost, eperday, evat, how, aextras, atotal,
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
      designReservation();
      $.modal.close();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
      $.modal.close();
    });
}

function assignExtra() {
  var eid= $('#selectExtra').val();
  if (!eid) {
    humanMsg.displayMsg('Select a valid extra or define a new one');
    return;
  }
  var how= $('#selectExtraHow').val();
  var e= _tempExtras[eid];
  var ecost= parseFloat(e.cost);
  var epd= e.perday;
  var ename= e.name;
  var evat= e.vat;
  if (epd) {
    var d= diffDateDays(zakEditReservation.dfrom, zakEditReservation.dto);
    var etotal= ecost * d;
  } else
    var etotal= ecost;
  etotal*= parseInt(how);

  var extras= getResExtras();
  var found= false;
  for (var i= 0; i< extras.length; i++) {
    if (extras[i].id == eid) {
      extras[i].cost= parseFloat(extras[i].cost) + etotal;
      extras[i].how=  parseInt(extras[i].how) + parseInt(how);
      found= true;
      break
    }
  }
  if (!found) {
    extras.push({name: ename, cost: etotal, id: eid, how: how, vat: evat});
  }
  extras= JSON.stringify(extras);
  llModReservation(localStorage.editOccupancyRid, {extras: extras},
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
      designReservation();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
    });
}

function removeAssignedExtra(eid) {
  var extras= getResExtras();
  var newextras= [];
  for (var i= 0; i< extras.length; i++) {
    var e= extras[i];
    if (e.id != eid) newextras.push(e);
  }
  newextras= JSON.stringify(newextras);
  llModReservation(localStorage.editOccupancyRid, {extras: newextras},
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
      designReservation(1);
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
    });
}

function saveUpdatedExtras() {
  var extras= getResExtras();
  for (var i= 0; i< extras.length; i++) {
    var e= extras[i];
    var ecost= $('#extra_cost_' + e.id).val();
    var ehow= $('#extra_how_'+ e.id).val();
    if (parseInt(ehow) != ehow || !checkFloat(ecost) ) {
      humanMsg.displayMsg('Please, specify good values (decimal? use the "." [dot])');
      return;
    }
    e.cost= ecost;
    e.how= ehow;
  }
  extras= JSON.stringify(extras);
  llModReservation(localStorage.editOccupancyRid, {extras: extras},
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
      designReservation(1);
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
    });
}

function existCustomer() {
  $.modal.close();
  $('#cust_finder').remove();
  $('#td_finder').append('<input type="text" id="cust_finder" style="width:200px"></input>');
  llGetAllCustomers(function(ses, recs) {
    var data= [];
    for (var i= 0; i < recs.rows.length; i++) {
      var rec= recs.rows.item(i);
      console.log('Email: ' + rec.email);
      if (rec.email) 
        data.push({label: rec.name + '(' + rec.email + ')', code: rec.id});
      else
        data.push({label: rec.name, code: rec.id});
    }
    $('#cust_finder').autocomplete({
      source: data,
      minLength: 2,
      select: function(event, ui) {
        $('#cust_finder').val(ui.item.label);
        $('#cust_finder_hidden').val(ui.item.code);
        $('#button_cust_finder').show();
        return false;
      }
    });
    $('#existcustomer_div').modal();
  });
}

function assignExistingCustomer() {
  var cid= $('#cust_finder_hidden').val();
  if (!cid) {
    humanMsg.displayMsg('Invalid customer', 1);
    return;
  }
  llAssignExistingCustomer(zakEditReservation.id, cid,
    function(ses, recs) {
      designCustomers();
      humanMsg.displayMsg('Sounds good');
      $.modal.close();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
    });
}

function addCustomer(cid) {
  $.modal.close();
  if (!cid) {
    designCustomerCountries();
    /*$('#ac_country').val('Type something...');*/
    /*$('#ac_country_hidden').val('');*/
    $('#cust_name').val('');
    $('#cust_city').val('');
    $('#cust_zip').val('');
    $('#cust_address').val('');
    $('#cust_vat').val('');
    $('#cust_birth_place').val('');
    $('#cust_birth_month').val('1');
    $('#cust_birth_year').val('');
    $('#cust_gender').val('1');
    $('#cust_phone').val('');
    $('#cust_notes').val('');
    $('#cust_email').val('');
    $('#chooseForInvoice').attr('checked', false);
    $('#row_vat').hide();
    $('#cust_id').val('');
  } else {
    $('#cust_id').val(cid);
  }
  $('#addcustomer_div').modal();
}

function editCustomer(cid) {
  designCustomerCountries();
  llGetCustomer(cid, zakEditReservation.id,
    function(ses, recs) {
      var cust= recs.rows.item(0);
      console.log(cust);
      $('#ac_country').val(cust.country);
      $('#ac_country_hidden').val(cust.country_code);
      $('#cust_name').val(cust.name);
      $('#cust_city').val(cust.city);
      $('#cust_zip').val(cust.zip);
      $('#cust_address').val(cust.address);
      $('#cust_vat').val(cust.vat);
      $('#cust_birth_place').val(cust.bplace);
      $('#cust_birth_month').val(cust.bmonth);
      $('#cust_birth_year').val(cust.byear);
      $('#cust_gender').val(cust.gender);
      $('#cust_phone').val(cust.phone);
      $('#cust_notes').val(cust.notes);
      $('#cust_email').val(cust.email);
      if (cust.maininvoice) {
        $('#chooseForInvoice').attr('checked', true);
        $('#row_vat').show();
      } else {
        $('#chooseForInvoice').attr('checked', false);
        $('#row_vat').hide();
      }
      addCustomer(cid);
    });
}

function _delCustomer() {
  llDelCustomer(delCustomerId, false, function(ses, recs) {
    designCustomers();
    humanMsg.displayMsg('Sounds good');
    $.modal.close();
  }, function(ses, err) {
    humanMsg.displayMsg('Error there: ' + err.message, 1);
  });
}

function _delRCustomer() {
  llDelCustomer(delCustomerId, zakEditReservation.id, function(ses, recs) {
    designCustomers();
    humanMsg.displayMsg('Sounds good');
    $.modal.close();
  }, function(ses, err) {
    humanMsg.displayMsg('Error there: ' + err.message, 1);
  });
}


function delCustomer(cid) {
  delCustomerId= cid;
  $('#delcustomer_div').modal();
}

function assignCustomer() {
  var bname= $('#cust_name').val() || '';
  if (!bname) {
    humanMsg.displayMsg('Customer name is required', 1);
    return;
  }
  var cntry= $('#ac_country').val() || '';
  if (cntry.indexOf('Enter') == 0) {
    cntry= '';
    var cntryc= '';
  } else 
    var cntryc= $('#ac_country_hidden').val() || '';
  var city= $('#cust_city').val() || '';
  var street= $('#cust_address').val() || '';
  var zip= $('#cust_zip').val() || '';
  var bmonth= $('#cust_birth_month').val() || '';
  var byear= $('#cust_birth_year').val() || '';
  var bplace= $('#cust_birth_place').val() || '';
  var bgender= $('#cust_gender').val() || '';
  var bemail= $('#cust_email').val() || '';
  var bphone= $('#cust_phone').val() || '';
  var bnotes= $('#cust_notes').val() || '';
  var bvat= $('#cust_vat').val() || '';
  if ($('#chooseForInvoice').is(':checked')) 
    var binvoice= 1;
  else var binvoice= 0;

  var cdict= {
   name: bname,
   country: cntry,
   country_code: cntryc,
   city: city,
   address: street,
   zip: zip,
   bmonth: bmonth,
   byear: byear,
   bplace: bplace,
   gender: bgender,
   email: bemail,
   phone: bphone,
   notes: bnotes,
   vat: bvat
  }

  var cid= $('#cust_id').val();
  if (cid) {
    console.log('Modifying existing customer');
    llModCustomer(cid, cdict, zakEditReservation.id, $('#chooseForInvoice').is(':checked'),
      function(ses, recs) {
        humanMsg.displayMsg('Sounds good');
        designCustomers();
        $.modal.close();
      },
      function(ses, err) {
        humanMsg.displayMsg('Error there: ' + err.message);
      });
  }
  else {
    console.log('Adding new customer');
    llAssignCustomer(zakEditReservation.id, cdict, $('#chooseForInvoice').is(':checked'),
      function(ses, recs) {
        humanMsg.displayMsg('Sounds good');
        designCustomers();
        $.modal.close();
      },
      function(ses, err) {
        humanMsg.displayMsg('Error there: ' + err.message);
      });
  }
}

function eventuallyShowInvoice() {
  if ($('#chooseForInvoice').is(':checked'))
    $('#row_vat').show();
  else
    $('#row_vat').hide();
}


function saveRemarks() {
  var r= $('#rremarks').val();
  llModReservation(localStorage.editOccupancyRid, {remarks: r},
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message, 1);
    });
}

function saveRoomsPrices() {
  var prices= {};
  for (var i= 0; i< zakEditReservation.rooms.length; i++) {
    var rprices= [];
    var rid= zakEditReservation.rooms[i].id;
    for (var j= 0; j< diffDateDays(zakEditReservation.dfrom, zakEditReservation.dto); j++) {
      rprices.push($('#price_' + rid + '_' + j).val());
    }
    prices[rid]= rprices;
  }
  prices= JSON.stringify(prices);
  llModReservation(localStorage.editOccupancyRid, {custom_pricing: prices},
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
    });
}

function designCustomer() {
  zakDesignAcCountries();
}

function designCustomerCountries() {
  $('#ac_country').remove();
  $('#countrygen').append('<input type="text" id="ac_country" style="width:140px" name="country" value="Enter country..." />');
  $('#ac_country').autocomplete({
    minLength: 2,
    focus: function(ev, ui) {$('#ac_country').val(ui.item.label);return false;},
    select: function(event, ui) {
      $('#ac_country').val(ui.item.label);
      $('#ac_country_hidden').val(ui.item.code);
      return false;
    },
    source: zakCountries
  }).data('autocomplete')._renderItem= function(ul, item) {
    return $( '<li style="font-size:16px"></li>' )
      .data( "item.autocomplete", item )
      .append( '<img style="float:left;margin-right:5px;margin-top:6px" src="/imgs/flags/' + item.code.toLowerCase() + '.gif"></img>' + '<a style="font-size:14px">' + item.label + '</a>')
      .appendTo( ul );
  };
  $('#ac_country').focus(function() {
    if ($(this).val().indexOf('Enter') == 0) {
      $(this).val('');
    }
  });
}


function designCustomers() {
  llGetReservationCustomers(zakEditReservation.id, 
    function(ses, recs) {
      var res= '';
      for (var i= 0; i< recs.rows.length; i++) {
        var cust= recs.rows.item(i);
        var cid= cust.id;
        res+= '<tr>';
        res+= '<td><a href="javascript:delCustomer(' + cid + ')">';
        res+= '<img src="/imgs/minus.png"/></a></td>';
        res+= '<td><b><a href="javascript:editCustomer(' + cid + ')">';
        res+= cust.name + '</a></b></td>';
      }
      $('#lcustomers').html(res);
    });
}

function buildReservationInvoice() {
  llGetItypes(
    function(ses, recs) {
      if (recs.rows.length == 0) {
        llNewInvoiceType('Invoice', function(ses, recs) {buildReservationInvoice()});
        return;
      }
      if (recs.rows.length == 1) {
        localStorage.editInvoiceItype= recs.rows.item(0).id;
        goToSameDirPage('invoice');
        return;
      }
      var res= '';
      for (var i= 0; i< recs.rows.length; i++) {
        var it= recs.rows.item(i);
        res+= '<option value="' + it.id + '">' + it.name + '</option>';
      }
      $('#cmbwhichinvoice').html(res);
      $('#whichinvoice').modal({position: [y,x]});
    });
  var el= $('#ibuilder');
  var x= el.offset().left;
  var y= el.offset().top;
}

function editInvoice() {
  localStorage.editInvoiceItype= $('#cmbwhichinvoice').val();
  goToSameDirPage('invoice');
}

$(document).ready(function() {
  designReservation();
});

