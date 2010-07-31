function _stupidDelete(i,t,cb,cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('delete from ' + t + ' where id = ?', [i], 
    cb || function(ses, recs) {
      $.modal.close();
      /*document.location.reload(false);*/
      humanMsg.displayMsg('Sounds good');
    }, cbe ||
    function(ses, err) {
      $.modal.close();
      humanMsg.displayMsg('Error there: ' + err.message, 1);
    });
  });
}

function _stupidSearch(s, t, cb, cbe) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    ses.executeSql('select * from ' + t + ' where name like ?', 
      _likeZakSearch([s]), cb, cbe);
  });
}

function _likeZakSearch(ar) {
  var res= [];
  for (var i= 0; i< ar.length; i++) {
    res.push( '%' + ar[i] + '%');
  }
  return res;
};
function llSearchCustomers(s, cb, cbe) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    console.log(s);
    ses.executeSql('select * from customer where name like ? or email like ?', 
      _likeZakSearch([s,s]), cb, cbe);
  });
}

function llSearchExtras(s, cb, cbe) {
  _stupidSearch(s, 'extra', cb, cbe);
}

function llSearchPricing(s, cb, cbe) {
  _stupidSearch(s, 'pricing', cb, cbe);
}

function llSearchMeals(s, cb, cbe) {
  _stupidSearch(s, 'meal', cb, cbe);
}

function delExtra(eid) {
  $('#deleting_link').attr('href', 'javascript:_delExtra(' + eid + ')');
  $('#deleting_div').modal();
}

function delMeal(mid) {
  $('#deleting_link').attr('href', 'javascript:_delMeal(' + mid + ')');
  $('#deleting_div').modal();
}

function _delMeal(mid) {
  _stupidDelete(mid, 'meal');
}

function _delExtra(eid) {
  _stupidDelete(eid, 'extra');
}

function updateMeal(mid) {
  var name= $('#m_name_' + mid).val();
  var price= $('#m_price_' + mid).val();
  var vat= $('#m_vat_' + mid).val();
  var mtype= $('#m_mtype_' + mid).val();
  if (!checkFloat(price) || !checkFloat(vat)) {
    humanMsg.displayMsg('Specify good values: for decimal values, use the DOT "."');
    return;
  }
  var db= zakOpenDb();
  db.transaction(function(ses) {
    var ob= {
      name: name,
      price: price,
      vat: vat,
      mtype: mtype
    }
    var q= updateStatementWhere(ob, 'where id = ?', [mid], 'meal');
    console.log(q);
    ses.executeSql(q.qry, q.qarr,
    function(ses, recs) {
      $.modal.close();
      /*document.location.reload(false);*/
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      $.modal.close();
      humanMsg.displayMsg('Error there: ' + err.message, 1);
    });
  });
}

function updateExtra(eid) {
  var name= $('#e_name_' + eid).val();
  if (!name) {
    humanMsg.displayMsg('Please, specify a valid name');
    return;
  }
  var cost= $('#e_cost_' + eid).val();
  var vat= $('#e_vat_' + eid).val();
  if (!checkFloat(cost) || !checkFloat(vat)) {
    humanMsg.displayMsg('Please, specify good values (decimal values? use "." - the-dot -)');
    return;
  }
  var perday= $('#e_perday_' + eid).val();
  var db= zakOpenDb();
  db.transaction(function(ses) {
    var ob= {
      name: name,
      cost: cost,
      vat: vat,
      perday: perday
    }
    var q= updateStatementWhere(ob, 'where id = ?', [eid], 'extra');
    console.log(q);
    ses.executeSql(q.qry, q.qarr,
    function(ses, recs) {
      $.modal.close();
      /*document.location.reload(false);*/
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      $.modal.close();
      humanMsg.displayMsg('Error there: ' + err.message, 1);
    });
  });
}

function delPricing(pid) {
  $('#deleting_link').attr('href', 'javascript:_delPricing(' + pid + ')');
  $('#deleting_div').modal();
}

function _delPricing(pid) {
  _stupidDelete(pid, 'pricing');
}

function updatePricing(pid) {
  var name= $('#p_name_' + pid).val();
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('update pricing set name = ? where id = ?', [name, pid],
    function(ses, recs) {
      $.modal.close();
      /*document.location.reload(false);*/
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      $.modal.close();
      humanMsg.displayMsg('Error there: ' + err.message, 1);
    });
  });
}

function delCustomer(cid) {
  $('#delcustomer_id').val(cid);
  $('#delcustomer_div').modal();
}

function _delCustomer() {
  var cid= $('#delcustomer_id').val();
  console.log('Deleting customer:' + cid);
  llDelCustomer(cid, false,
    function(ses, recs) {
      $.modal.close();
      /*document.location.reload(false);*/
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      $.modal.close();
      humanMsg.displayMsg('Error there: ' + err.message, 1);
    });
}
function updateCustomer(cid) {
  var _i= function(n) {
    return $('#c_' + n + '_' + cid).val();
  }
  console.log('Updating customer');
  var name= _i('name');
  if (!name) {
    humanMsg.displayMsg('Please, specify a valid customer name');
    return;
  }
  var mail= _i('email') || '';
  var phone= _i('phone') || '';
  var city= _i('city') || '';
  var zip= _i('zip') || '';
  var address= _i('address') || '';
  var bmonth= _i('bmonth') || 1;
  var byear= _i('byear') || '';
  var bplace= _i('bplace') || '';
  var bnotes= _i('notes') || '';
  var gender= _i('gender') || 1;
  var d= {
    name: name,
    email: mail,
    phone: phone,
    zip: zip,
    address: address,
    bmonth: bmonth,
    byear: byear,
    bplace: bplace,
    notes: bnotes,
    gender: gender
  }
  llModCustomer(cid, d, false, false, 
    function(ses, recs) {
      humanMsg.displayMsg('Sounds good');
    },
    function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message, 1);
    });
}
