function llGetProperties(cbs, cbe) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    ses.executeSql('select * from property', new Array(), cbs, cbe);
  });
}

function llDelProperty(pid, cbs, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('delete from property where id = ?', [pid], cbs, cbe);
  });
}

function llNewProperty(name, cbs, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('insert into property (name) values (?)', [name], cbs, cbe);
  });
}

function llModProperty(pid, params, cbs, cbe) {
  db= zakOpenDb();
  db.transaction(function(ses) {
    var key,value;
    var t= new Array();
    var qparams= new Array();
    for(key in params) {
      t.push(key + '=?');
      qparams.push(params[key]);
    }
    qparams.push(pid);
    var s= t.join(',');
    var s= 'update property set ' + s + ' where id = ?';
    ses.executeSql(s, qparams, cbs, cbe);
  });
}

function llModPropertyW(pid, params, cbs, cbe) {
  llModProperty(pid, params, 
    function(ses, recs) {
      var prop= getActiveProperty();
      for (var k in params) prop[k]= params[k];
      setActiveProperty(prop);
      cbs(ses, recs);
    }, cbe);
}

/* cbs is cbs(rows) */
function llLoadRooms(pid, cbs, cbe) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    console.log('Reading rooms for property ' + pid);
    ses.executeSql('select * from room where id_property = ?', [pid], cbs, cbe);
  });
}

function llModRoom(rid, name, code, cbs, cbe) {
  db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('update room set name= ?, code = ? where id = ?', [name,code,rid], cbs, cbe);
  });
}

function llDeleteRooms(pid, tobedeleted, cbs, cbe) {
  var d= multipleSqlWhere(tobedeleted, 'id');
  var of= d['qry'];
  var qarray= d['qar'];
  var db= zakOpenDb();
  db.transaction(function(ses) {
    var sqlstr= 'delete from room where id_property = ' + pid + ' and (' + of + ')';
    ses.executeSql(sqlstr, qarray, cbs, cbe);
  });
}

function llNewRoom(pid, rcode, rname, cbs, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('insert into room (code,name,id_property) values (?,?,?)', [rcode,rname,pid], cbs, cbe);
  });
}

function llLoadOccupancies(rids, dfrom, dto, cbs, cbe) {
  var udfrom= unixDate(dfrom);
  if(typeof(dto) == 'number' && dto < 1000) {
    var jdfrom= jsDate(dfrom);
    var udto= unixDate(dateAddDays(jdfrom, dto));
  } else var udto= unixDate(dto);

  var q= multipleSqlWhere(rids, 'id');
  var qar= q['qar'];
  var qry= q['qry'];

  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    qar.push(udfrom);qar.push(udto);
    var s= 'select * from occupancy where (' + qry + ') and dfrom >= ? and dfrom <= ?';
    s+= ' order by dfrom';
    ses.executeSql(s, qar, cbs, cbe);
  });
}

function llCheckOccupancyChance(oid, rid, day, n, args, cb) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    var s= 'select min(dfrom) as dfrom from occupancy where id_room = ? and dfrom > ?';
    if (oid) s+= ' and occupancy.id != ' + oid;
    ses.executeSql(s, [rid, unixDate(day)], 
      function(ses, recs) {
        var df= recs.rows.item(0).dfrom;
        if (!df) {cb(ses, args);return;}
        var diff= diffDateDays(day, df);
        if (n <= diff) {cb(ses, args);return;}
        cb(ses, false);
      },
      function(ses, err) {
        console.log('Error here: ' + err.message);
        cb(ses, false);
      });
  });
}

function llDelOccupancy(oid, cbs, cbe) {
  db= zakOpenDb();
  db.transaction(
    function(ses) {
      ses.executeSql('delete from occupancy where oid = ?', [oid], cbs, cbe);
    });
}

function llMoveOccupancy(oid, udfrom, udto, rid, cbs, cbe) {
  console.log('Updating dfrom, dto, idr, oid' + [udfrom,udto,rid,oid].join(', '));
  var targs= {udfrom: udfrom, udto: udto, rid: rid, oid: oid};
  llCheckOccupancyChance(oid, rid, udfrom, diffDateDays(udfrom, udto), targs,
    function(ses, newargs) {
      if (!newargs) {
        cbs(false);
        return;
      }
      var nudfrom= newargs['udfrom'];
      var nudto= newargs['udto'];
      var rid= newargs['rid'];
      var oid= newargs['oid'];
      ses.executeSql('update occupancy set dfrom = ?, dto= ?, id_room= ? where id = ?',
                  [unixDate(udfrom), unixDate(udto), rid, oid], cbs, cbe);
    });
}

function llCopyOccupancy(occ, cust, udfrom, udto, rid, cbs, cbe) {
  var targs= {occ: occ, udfrom: udfrom, udto: udto, rid: rid, customer: cust};
  llCheckOccupancyChance(occ['id'], rid, udfrom, diffDateDays(udfrom, udto), targs,
    function(ses, args) {
      if (!args) {
        cbs(false);
        return;
      }
      var aocc= args.occ;
      var arid= args.rid;
      var audf= args.udfrom;
      var audt= args.udto;
      var acust= args.customer;
      console.log(acust);
      _addOcc(audf, audt, arid, acust, aocc['status'], aocc['id_reservation'], ses, cbs, cbe);
      }, cbe);
}

function _addOcc(udfrom, udto, rid, customer, stat, resid, ses, cbs, cbe) {
  var ss= 'insert into occupancy (dfrom,dto,id_room,customer,status,id_reservation) ';
  ss+= ' values (?,?,?,?,?,?)';
  ses.executeSql(ss, [unixDate(udfrom), unixDate(udto), rid, customer, stat, resid],
    function(ses, recs) {
      var newoid= recs.insertId;
      ses.executeSql('select code from room where id = ?', [rid], cbs, cbe);
    });
}

/* cbs(okocc) */
/* resid is eventually the reservation id */
function llNewOccupancy(pid, resid, stat, rid, udfrom, ndays, customer, cbs, cbe) {
  var args= {pid: pid, resid: resid, stat: stat, rid: rid, udfrom: udfrom, ndays: ndays, customer: customer};
  llCheckOccupancyChance(false, rid, udfrom, ndays, args,
    function(ses, newargs) {
      if (!newargs) {
        /* you're requesting an impossible reservation */
        /* callback with false as first arg*/
        cbs(false);
        return;
      }
      var udfrom= unixDate(newargs['udfrom']);
      var udto= unixDate(dateAddDays(udfrom, newargs['ndays']));
      var resid= newargs['resid'];
      var rid= newargs['rid'];
      var customer= newargs['customer'];
      var stat= newargs['stat'];
      if (resid) 
        return _addOcc(udfrom, udto, rid, customer, stat, resid, ses, cbs, cbe);

      /* Add a new reservation */
      var s= 'insert into reservation (dfrom,dto,customer,status,id_property) values ';
      s+= '(?,?,?,?,?)';
      ses.executeSql(s, [udfrom,udto,customer,stat,pid],
        function(ses, recs) {
          resid= recs.insertId;
          return _addOcc(udfrom, udto, rid, customer, stat, resid, ses, cbs, cbe);
        }
      );
    },
    function(ses, err) {
      cbe(ses, err);
      return;
    });
}

function llModOccupancy(oid, params, cbs, cbe) {
  db= zakOpenDb();
  db.transaction(function(ses) {
    var key,value;
    var t= new Array();
    var qparams= new Array();
    for(key in params) {
      t.push(key + '=?');
      qparams.push(params[key]);
    }
    qparams.push(oid);
    var s= t.join(',');
    var s= 'update occupancy set ' + s + ' where id = ?';
    ses.executeSql(s, qparams, cbs, cbe);
  });
}

/* cbs(reservation) */
function llGetReservationFromOid(oid, cbs, cbe) {
  db= zakOpenDb();
  db.readTransaction(function(ses) {
    s= 'select reservation.* from reservation join occupancy on reservation.id= occupancy.id_reservation ';
    s+= 'where occupancy.id = ?';
    ses.executeSql(s, [oid], 
      function(ses, recs){
        var reservation= recs.rows.item(0);
        ses.executeSql('select * from occupancy where id_reservation = ?', [reservation.id], 
          function(ses, recs) {
            var occs= new Array();
            var i= 0;
            for(i=0;i<recs.rows.length;i++) occs.push(recs.rows.item(i));
            reservation['occupancies']= occs;
            cbs(reservation);
          }, 
          function(ses, err) {cbe(ses, err);});
      }, 
      function(ses, err) {cbe(ses, err);});
  });
}

function llLoadRoomSetups(cbs, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('select * from room_setup', [], cbs, cbe);
    });
}

function llAddRSetup(rname, cbs, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('insert into room_setup (name) values (?)', [rname], cbs, cbe);
  });
}

function llModReservation(rid, params, cbs, cbe) {
  db= zakOpenDb();
  db.transaction(function(ses) {
    var key,value;
    var t= new Array();
    var qparams= new Array();
    for(key in params) {
      t.push(key + '=?');
      qparams.push(params[key]);
    }
    qparams.push(rid);
    var s= t.join(',');
    var s= 'update reservation set ' + s + ' where id = ?';
    ses.executeSql(s, qparams, cbs, cbe);
  });
}

function llLoadExtras(cbs, cbe) {
  db= zakOpenDb();
  db.readTransaction(function(ses) {
    ses.executeSql('select * from extra', [], cbs, cbe);
  });
}

function llAddExtra(name, cost, cbs, cbe) {
  db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('insert into extra (name,cost) values (?,?)', [name, cost], cbs, cbe);
  });
}

function llLoadPricing(cbs, cbe) {
  db= zakOpenDb();
  db.readTransaction(function(ses) {
    ses.executeSql('select * from pricing', [], cbs, cbe);
  });
}

function llNewPricing(name, cbs, cbe) {
  db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('insert into pricing (name) values (?)', [name], cbs, cbe);
  });
}

function llModPricing(pid, params, cbs, cbe) {
  db= zakOpenDb();
  db.transaction(function(ses) {
    var sd= updateStatement(params); 
    console.log(sd);
    sqry= sd['qry'];
    sqarr= sd['qarr'];
    sqarr.push(pid);
    ses.executeSql('update pricing set ' + sqry + ' where id = ?', sqarr, cbs, cbe);
  });
}

function llLoadPricesPeriods(pid, cbs, cbe) {
  db= zakOpenDb();
  db.readTransaction(function(ses) {
    var adfrom= unixDate();
    if (pid) 
      ses.executeSql('select * from pricing_periods where id_pricing = ? and dto > ?', [pid, adfrom], cbs, cbe);
    else
      ses.executeSql('select * from pricing_periods where id_pricing is null and dto > ?', [adfrom], cbs, cbe);
  });
}

function llNewPricesPeriod(pid, periods, cbs) {
  db= zakOpenDb();
  db.transaction(function(ses) {
    console.log('dai dio cane');
    console.log(periods);
    var i, per, sd, sqry, sqarr;
    console.log('Working on ' + periods.length + ' periods');
    for(i=0;i<periods.length;i++) {
      per= periods[i]; 
      if (per['id']) {
        console.log('period to be updated');
        sd= updateStatement(per); 
        sqry= sd['qry'];
        sqarr= sd['qarr'];
        sqarr.push(per['id']);
        ses.executeSql('update pricing_periods set ' + sqry + ' where id = ?', sqarr);
      } else {
        console.log('period to be inserted');
        if (pid) per['id_pricing']= pid;
        sd= insertStatement(per);
        ses.executeSql('insert into pricing_periods ' + sd['qry'], sd['qarr']);
      }
    }
    cbs();
  });
}

function llDelPricesPeriod(pid, cbs, cbe) {
  db= zakOpenDb();
  db.transaction(function(ses) {
      ses.executeSql('delete from pricing_periods where id = ?', [pid], cbs, cbe);
  });
}
