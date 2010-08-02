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

function llSearchRoom(s, cb, cbe) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    console.log(s);
    ses.executeSql('select * from room where name like ? or code like ?', 
      _likeZakSearch([s,s]), cb, cbe);
  });
}

function llSearchReservations(s, cb, cbe) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    var bqry= 'select reservation.*,customer.name as rname from reservation ';
    bqry+= 'left join rcustomer on rcustomer.id_reservation = reservation.id left join customer ';
    bqry+= 'on customer.id= rcustomer.id_customer';
    ses.executeSql('select * from (' + bqry + ') where rname like ? or customer like ?',
      _likeZakSearch([s,s]), 
      function(ses, recs) {
        var res= [];
        for (var i= 0; i< recs.rows.length; i++) {
          var r= recs.rows.item(i);
          if (!res.indexOf(r.id) >= 0) res.push(r);
        }
        cb(ses, res); 
      },
      function(ses, err) {console.log('Error: ' + err.message); cbe(ses, err);});
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

function llSearchRoomSetup(s, cb, cbe) {
  _stupidSearch(s, 'room_setup', cb, cbe);
}
function llSearchRoomType(s, cb, cbe) {
  _stupidSearch(s, 'room_type', cb, cbe);
}

function delRoomType(rtid) {
  $('#deleting_link').attr('href', 'javascript:_delRoomType(' + rtid + ')');
  $('#deleting_div').modal();
}

function delRoom(rid) {
  $('#delroom_id').val(rid);
  $('#delroom_div').modal();
}

function _delRoom() {
  var rid= $('#delroom_id').val();
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('delete from room where id = ?', [rid],
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

function updateRoom(rid) {
  var name= $('#room_name_' + rid).val();
  var code= $('#room_code_' + rid).val();
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('select id from room where code = ? and id != ?', [code, rid],
      function(ses, recs) {
        if (recs.rows.length > 0) {
          humanMsg.displayMsg('Room code already in use');
          return;
        }
        ses.executeSql('update room set name = ?, code = ? where id = ?', [name, code, rid],
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
  });
}

function _delRoomType(rtid) {
  var newrt= $('#rt_newrtype_' + rtid).val();
  if (!newrt || newrt == rtid) {
    humanMsg.displayMsg('You must associate orphaned rooms to a new, valid room type');
    return;
  }
  var cbe= function(ses, err) {humanMsg.displayMsg('Error there: '+ err.message); return };
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('update room set id_room_type = ? where id_room_type = ?', [newrt, rtid],
      function(ses, recs) {
        ses.executeSql('delete from room_type where id = ?', [rtid],
          function(ses, recs) {
            humanMsg.displayMsg('Sounds good');
            $.modal.close();
            return;
          }, cbe);
      }, cbe);
  });
}

function updateRoomType(rsid) {
  var name= $('#rt_name_' + rsid).val();
  if (!name) {
    humanMsg.displayMsg('Please, specify a valid name');
    return;
  }
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('update room_type set name = ? where id = ?', [name, rsid],
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
  if (!name) {
    humanMsg.displayMsg('Please, specify a valid name');
    return;
  }
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

function delReservation(rid) {
  $('#delreservation_id').val(rid);
  $('#delreservation_div').modal();
}

function _delReservation() {
  var rid= $('#delreservation_id').val();
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('delete from reservation where id = ?', [rid],
      function(ses, recs) {
        humanMsg.displayMsg('Reservation deleted');
        $.modal.close();
      },
      function(ses, err) {
        humanMsg.displayMsg('Error there: ' + err.message);
      });
  });
}

function goTableau(rid) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('select dfrom from reservation where id = ?', [rid],
      function(ses, recs) {
        var dfrom= recs.rows.item(0).dfrom;
        dfrom= parseInt(dfrom) - (86400 *2) ;
        localStorage.zakTableauDate= dfrom;
        goToSameDirPage('tableau');
      },
      function(ses, err) {
        humanMsg.displayMsg('Error there: ' + err.message);
      });
  });
}

function goDetails(rid) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('select id from occupancy where id_reservation = ?', [rid],
      function(ses, recs) {
        var oid= recs.rows.item(0).id;
        localStorage.editOccupancyOid= oid;
        localStorage.editOccupancyRid= rid;
        goToSameDirPage('book');
      },
      function(ses, err) {
        humanMsg.displayMsg('Error there: ' + err.message);
      });
  });
}

