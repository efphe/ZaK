ZAK_MAP_STATUS= {
  1: 'c', /* confirmed */
  2: 'n', /* not confirmed */
  3: 'i', /* checkin */
  4: 'p', /* preview */
}

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

function llNewProperty(name, currency, cbs, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('insert into property (name, currency) values (?,?)', [name,currency], cbs, cbe);
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
    ses.executeSql('select * from room where id_property = ?', [pid], cbs, cbe);
  });
}

function llGetRoomTypes(cbs, cbe) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    ses.executeSql('select * from room_type order by id', [], cbs, cbe);
  });
}

function llModRoom(rid, name, code, rtype, cbs, cbe) {
  db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('update room set name= ?, code = ?, id_room_type= ? where id = ?', 
      [name,code,rtype,rid], cbs, cbe);
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

function llNewRoom(pid, rcode, rname, rtype, cbs, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('insert into room (code,name,id_property,id_room_type) values (?,?,?,?)', [rcode,rname,pid,rtype], cbs, cbe);
  });
}
function llNewRoomAndType(pid, rcode, rname, rtype, cbs, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('insert into room_type (name) values (?)', [rtype], 
      function(ses, recs) {
        var rtypeid= recs.insertId;
        console.log([rcode,rname,pid,rtypeid]);
        ses.executeSql('insert into room (code,name,id_property,id_room_type) values (?,?,?,?)', [rcode,rname,pid,rtypeid], cbs, cbe);
      }, cbe);
  });
}

function llUpdRoomAndType(rid, rname, rcode, newtype, cb, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('insert into room_type (name) values (?)', [newtype], 
      function(ses, recs) {
        var rtid= recs.insertId;
        ses.executeSql('update room set code = ?, name = ?, id_room_type = ? where id = ?',
          [rcode,rname,rtid,rid], cb, cbe);
      }, cbe);
  });
}

function llLoadOccupancy(oid, cb) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    ses.executeSql('select * from occupancy where id = ?', [oid], cb);
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
    var s= 'select min(dfrom) as dfrom from occupancy where id_room = ? and dfrom >= ?';
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

// cb(isok), ce(ses, err)
function llCheckOccupancyChances(rids, day, n, cb, ce) {
  var counter= rids.length;
  var ok= true;
  for (var i= 0; i< rids.length; i++) {
    var rid= rids[i];
    llCheckOccupancyChance(false, rid, day, n, true, 
      function(ses, isok) {
        counter-= 1;
        if (!isok) ok= false;
        if (counter == 0) {
          cb(ok);
        }
      });
  }
}

function llDelOccupancy(oid, cbs, cbe) {
  var db= zakOpenDb();
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
      var q= 'select occupancy.id_room,reservation.custom_pricing,reservation.id from occupancy ';
      q+= 'join reservation on reservation.id = occupancy.id_reservation where occupancy.id = ?';
      ses.executeSql(q, [oid], 
        function(ses, recs) {
          var nudfrom= newargs['udfrom'];
          var nudto= newargs['udto'];
          var rid= newargs['rid'];
          var oid= newargs['oid'];
          var res= recs.rows.item(0);
          var oldrid= res.id_room;
          var pricing= res.custom_pricing;
          console.log('Old pricing: ' + pricing);
          if (pricing) {
            pricing= JSON.parse(pricing);
            console.log(pricing);
            if (pricing[oldrid]) {
              pricing[rid]= pricing[oldrid];
              delete pricing[oldrid];
              console.log(pricing);
              pricing= JSON.stringify(pricing);
              ses.executeSql('update reservation set custom_pricing= ? where id = ?', [pricing, res.id]);
            }
          }
          ses.executeSql('update occupancy set dfrom = ?, dto= ?, id_room= ? where id = ?',
                      [unixDate(udfrom), unixDate(udto), rid, oid], cbs, cbe);
        }, 
      cbe);
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
      _addOcc(audf, audt, arid, acust, false, aocc['status'], aocc['id_reservation'], ses, cbs, cbe);
      }, cbe);
}

function _addOcc(udfrom, udto, rid, customer, excustomer, stat, resid, ses, cbs, cbe) {
  var ss= 'insert into occupancy (dfrom,dto,id_room,customer,status,id_reservation) ';
  ss+= ' values (?,?,?,?,?,?)';
  ses.executeSql(ss, [unixDate(udfrom), unixDate(udto), rid, customer, stat, resid],
    function(ses, recs) {
      if (excustomer) {
        console.log('Linking customer: ' + excustomer);
        llAssignExistingCustomer(rid, excustomer, function(ses, recs) {
          ses.executeSql('select code from room where id = ?', [rid], cbs, cbe);
        }, cbe);
      } else 
        ses.executeSql('select code from room where id = ?', [rid], cbs, cbe);
    });
}

function llNewReservationAndOccupancies(pid, stat, rids, udfrom, ndays, customer, optargs, rcustomer, cbs, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    var dfrom= unixDate(udfrom);
    var dto= unixDate(dateAddDays(udfrom, ndays));
    console.log('Inserting now a new reservation...');
    var s= 'insert into reservation (dfrom,dto,customer,status,id_property) values ';
    s+= '(?,?,?,?,?)';
    ses.executeSql(s, [dfrom, dto, customer,stat,pid], 
      function(ses, recs) {
        console.log('Associating now occupancies...');
        var resid= recs.insertId;
        if (optargs) {
          var sd= updateStatement(optargs); 
          var sqry= sd['qry'];
          var sqarr= sd['qarr'];
          sqarr.push(resid);
          ses.executeSql('update reservation set ' + sqry + ' where id = ?', sqarr);
        }
        if (rcustomer) {
          console.log('Assigning new customer to this reservation');
          llAssignCustomer(resid, rcustomer, false, function(s, r) {}, function(s, e) {});
        }
        var ss= 'insert into occupancy (dfrom,dto,id_room,customer,status,id_reservation) ';
        ss+= ' values (?,?,?,?,?,?)';

        var counter= rids.length;
        var f= function() {
          if (counter == 1) var h= cbs;
          else var h= function() {zakSleep(100);f();};
          counter-= 1;
          var rid= rids[counter];
          ses.executeSql(ss, [dfrom, dto, rid, customer, stat, resid], h, cbe);
        };
        f();

        /*for (var i= 0; i< rids.length; i++) {*/
        /*zakSleep(30);*/
        /*var rid= rids[i];*/
        /*ses.executeSql(ss, [dfrom, dto, rid, customer, stat, resid],*/
        /*function(ses, recs) {*/
        /*counter-= 1;*/
        /*if (counter == 0) cbs();*/
        /*}, cbe);*/
        /*}*/
      }, cbe);
  });

}

/* cbs(okocc) */
/* resid is eventually the reservation id */
function llNewOccupancy(pid, resid, stat, rid, udfrom, ndays, customer, excustomer, cbs, cbe) {
  if (excustomer && !customer) {
    console.log('Loading customer (pre booking) ' + excustomer);
    llGetCustomer(excustomer, false, function(ses, recs) {
      var lc= recs.rows.item(0);
      console.log('Inserting new reservation with existcustomer customer');
      console.log(lc);
      llNewOccupancy(pid, resid, stat, rid, udfrom, ndays, lc.name, excustomer, cbs, cbe);
        }, cbe);
    return;
  }
  var args= {pid: pid, resid: resid, stat: stat, rid: rid, udfrom: udfrom, ndays: ndays, customer: customer};
  llCheckOccupancyChance(false, rid, udfrom, ndays, args,
    function(ses, newargs) {
      if (!newargs) {
        console.log('Impossible occupancy');
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
        return _addOcc(udfrom, udto, rid, customer, excustomer, stat, resid, ses, cbs, cbe);

      console.log('Fresh reservation');
      /* Add a new reservation */
      var s= 'insert into reservation (dfrom,dto,customer,status,id_property) values ';
      s+= '(?,?,?,?,?)';
      ses.executeSql(s, [udfrom,udto,customer,stat,pid],
        function(ses, recs) {
          console.log('Now adding occupancy');
          resid= recs.insertId;
          return _addOcc(udfrom, udto, rid, customer, excustomer, stat, resid, ses, cbs, cbe);
        }, cbe);
    },
    function(ses, err) {
      cbe(ses, err);
      return;
    });
}

function llModOccupancy(oid, params, cbs, cbe) {
  var db= zakOpenDb();
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
    ses.executeSql(s, qparams, 
      function(ses, recs) {
        var idrid= 'select id_reservation from occupancy where id = ' + oid;
        rdfrom= 'select min(dfrom) from occupancy where id_reservation = (' + idrid + ')'; 
        rdto= 'select max(dto) from occupancy where id_reservation = (' + idrid + ')'; 
        var qry= 'update reservation set dfrom = (' + rdfrom + '), dto= (' + rdto + ')';
        qry+= ' where id = (' + idrid + ')';
        console.log(qry);
        ses.executeSql(qry, [], cbs, cbe);
      }, cbe);
  });
}

/* cbs(reservation) */
function llGetReservationFromOid(oid, cbs, cbe) {
  console.log('Loading reservation ' + oid);
  var db= zakOpenDb();
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
function llGetReservationFromRid(rid, cbs, cbe) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    s= 'select reservation.* from reservation ';
    s+= 'where reservation.id = ?';
    ses.executeSql(s, [rid], 
      function(ses, recs){
        var reservation= recs.rows.item(0);
        ses.executeSql('select * from occupancy where id_reservation = ?', [reservation.id], 
          function(ses, recs) {
            var occs= [];
            var i= 0;
            var rids= [];
            for(i=0;i<recs.rows.length;i++) {
              var occ= recs.rows.item(i);
              occs.push(occ);
              rids.push(occ['id_room'])
            }
            rids= rids.join(',');
            reservation['occupancies']= occs;
            var qry= 'select * from room where id in (' + rids + ')';
            ses.executeSql('select * from room where id in (' + rids + ')', [], 
              function(ses, recs) {
                var rrooms= arrayFromRecords(recs);
                reservation['rooms']= rrooms;
                cbs(reservation);
              });
          }, 
          function(ses, err) {cbe(ses, err);});
      }, 
      function(ses, err) {cbe(ses, err);});
  });
}

function llGetReservation(rid, oid, cbs, cbe) { 
  if (rid) llGetReservationFromRid(rid, cbs, cbe);
  else llGetReservationFromOid(oid, cbs, cbe);
}

function llLoadRoomSetups(cbs, cbe) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    ses.executeSql('select * from room_setup', [], cbs, cbe);
    });
}

function llAddRSetup(rname, oid, cbs, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    if (!oid)
      ses.executeSql('insert into room_setup (name) values (?)', [rname], cbs, cbe);
    else {
      ses.executeSql('insert into room_setup (name) values (?)', [rname], 
        function(ses, recs) {
          ses.executeSql('update occupancy set id_room_setup = ? where id = ?', [recs.insertId, oid], cbs, cbe);
        });
    }
  });
}

function llModReservation(rid, params, cbs, cbe) {
  var db= zakOpenDb();
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
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    ses.executeSql('select * from extra', [], cbs, cbe);
  });
}

function llAddExtra(rid, ename, ecost, eperday, evat, how, aextras, atotal, cbs, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('insert into extra (name,cost,perday,vat) values (?,?,?,?)', [ename,ecost,eperday,evat],
      function(ses, recs) {
        var eid= recs.insertId;
        aextras.push({name: ename, cost: atotal, id: eid, how: how, vat: evat});
        var s= JSON.stringify(aextras);
        ses.executeSql('update reservation set extras = ? where id = ?', [s,rid], cbs, cbe);
      }, cbe);
    });
}

function llLoadPricing(pid, cbs, cbe) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    ses.executeSql('select * from pricing where id = ?', [pid], cbs, cbe);
  });
}

function llLoadPricings(cbs, cbe) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    ses.executeSql('select * from pricing', [], cbs, cbe);
  });
}

function llNewPricing(name, cbs, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('insert into pricing (name) values (?)', [name], cbs, cbe);
  });
}

function llModPricing(pid, params, cbs, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    var sd= updateStatement(params); 
    var sqry= sd['qry'];
    var sqarr= sd['qarr'];
    sqarr.push(pid);
    ses.executeSql('update pricing set ' + sqry + ' where id = ?', sqarr, cbs, cbe);
  });
}

function llLoadPricesPeriods(pid, cbs, cbe) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    var adfrom= unixDate();
    if (pid) 
      ses.executeSql('select * from pricing_periods where id_pricing = ? and dto > ? order by dfrom', [pid, adfrom], cbs, cbe);
    else
      ses.executeSql('select * from pricing_periods where id_pricing is null and dto > ? order by dfrom', [adfrom], cbs, cbe);
  });
}

function llNewPricesPeriod(pid, periods, cbs) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    var i, per, sd, sqry, sqarr;
    for(i=0;i<periods.length;i++) {
      per= periods[i]; 
      if (per['del'] == 1) {
        ses.executeSql('delete from pricing_periods where id = ?',[per['id']]);
        continue
      }
      if (per['id']) {
        sd= updateStatement(per); 
        sqry= sd['qry'];
        sqarr= sd['qarr'];
        sqarr.push(per['id']);
        ses.executeSql('update pricing_periods set ' + sqry + ' where id = ?', sqarr);
        continue;
      } 
      if (pid) per['id_pricing']= pid;
      sd= insertStatement(per);
      ses.executeSql('insert into pricing_periods ' + sd['qry'], sd['qarr']);
    }
    cbs();
  });
}

function llDelPricesPeriod(pid, cbs, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
      ses.executeSql('delete from pricing_periods where id = ?', [pid], cbs, cbe);
  });
}

function llGetPeriodPricing(dfrom, dto, cbs, cbe) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    ses.executeSql('select * from pricing_periods');
  });
}

/*function llGetPricingPerioded(prid, dfrom, dto, cbs) {*/
/*db= zakOpenDb();*/
/*db.transaction(function(ses) {*/
/*ses.executeSql('select * from pricing where id = ?', [prid],*/
/*function(ses, recs) {*/
/*var pricing= recs.rows.item(0);*/
/*ses.executeSql('select * from pricing_periods where id_pricing = ?', [*/
/*}*/
/*});*/
/*}*/

/*function llGetRoomPricing(prid, dfrom, dto, cbs) {*/
/*if (!prid) {*/
/*var prices= new Array(), i;*/
/*for (i=0;i<diffDateDays(dfrom, dto);i++) {*/
/*prices.push(false);*/
/*}*/
/*cbs(prices);*/
/*}*/
/*db= zakOpenDb();*/
/*db.transaction(function(ses) {*/
/*var s= 'select * from pricing_periods where id_pricing = ? ';*/
/*s+= 'and dfrom < ? and dto > ? order by dfrom';*/
/*ses.executeSql(s, [prid, dto, dfrom], */
/*function(ses, recs) {*/
/*var periods= arrayFromRecords(recs);*/
/*var i, j, prices= new Array();*/
/*for(i=0;i<diffDateDays(dfrom, dto);i++) {*/
/*var d= dfrom+ (86400 * i), found= false;*/
/*for (j=0;j<periods.length;j++) {*/
/*var per= periods[j];*/
/*if (d>=per['dfrom'] && d<= per['dto']) {*/
/*prices.push(per); */
/*found= true;*/
/*break;*/
/*}*/
/*}*/
/*if (!found) {*/
/*if(per*/
/*}*/
/*}*/
/*});*/
/*});*/
/*}*/

function llGetDatedPricing(prid, xdfrom, xdto, excludelast, cbs, cbe) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    dfrom= unixDate(xdfrom);
    dto= unixDate(xdto);
    if (excludelast) {
      dto-= 86400;
    } else console.log('INcluding las tday');
    recs= ses.executeSql('select * from pricing where id = ?', [prid],
      function(ses, frecs) {
        var frow= frecs.rows.item(0), i;
        var aprices= new Array();
        var plen= diffDateDays(dfrom, dto) + 1;
        for (i=0;i<plen;i++) {
          aprices.push({
             price_ro: frow.price_ro, 
             price_bb: frow.price_bb, 
             price_hb: frow.price_hb, 
             price_fb: frow.price_fb} );
        }
        ses.executeSql('select * from pricing_periods where id_pricing = ? and dfrom <= ? and dto >= ?', [prid, dto, dfrom],
          function(ses, recs) {
            var cdate= parseInt(dfrom);
            dto= parseInt(dto)
            var limit= 1000, count= 0;
            while(1) {
              if (count>limit) {
                console.log('Ai ai aiaiaiaiai');
                break;
              }
              count+= 1;
              if (cdate > dto) break;
              for(j=0;j<recs.rows.length;j++) {
                var per= recs.rows.item(j);
                if (parseInt(per['dfrom']) <= cdate && parseInt(per['dto']) >= cdate) {
                  var idx= diffDateDays(cdate, dfrom);
                  aprices[idx]= {
                     price_ro: per.price_ro, 
                     price_bb: per.price_bb, 
                     price_hb: per.price_hb, 
                     price_fb: per.price_fb};
                  break;
                }
              }
              cdate+= 86400;
            }
            try {
              cbs(aprices);
            } catch(e) {};
          });
      });
  });
}

function llGetDatedPricing(prid, xdfrom, xdto, excludelast, cbs, cbe) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    dfrom= unixDate(xdfrom);
    dto= unixDate(xdto);
    if (excludelast) {
      dto-= 86400;
    } else console.log('INcluding las tday');
    recs= ses.executeSql('select * from pricing where id = ?', [prid],
      function(ses, frecs) {
        var frow= frecs.rows.item(0), i;
        var aprices= new Array();
        var plen= diffDateDays(dfrom, dto) + 1;
        try {
          var app= JSON.parse(frow.prices);
        } catch(e) {var app= -1};
        for (i=0;i<plen;i++)
          aprices.push(app);
        ses.executeSql('select * from pricing_periods where id_pricing = ? and dfrom <= ? and dto >= ?', 
                        [prid, dto, dfrom],
          function(ses, recs) {
            var cdate= parseInt(dfrom);
            dto= parseInt(dto)
            var limit= 1000, count= 0;
            while(1) {
              if (count>limit) {
                console.log('Ai ai aiaiaiaiai');
                break;
              }
              count+= 1;
              if (cdate > dto) break;
              for(j=0;j<recs.rows.length;j++) {
                var per= recs.rows.item(j);
                console.log(per['dfrom'] + ', ' + cdate + ', ' + per['dto']);
                if (parseInt(per['dfrom']) <= cdate && parseInt(per['dto']) >= cdate) {
                  var idx= diffDateDays(cdate, dfrom);
                  console.log('Found good period');
                  try {
                    var pper= JSON.parse(per.prices);
                  } catch(e) {pper= -1};
                  aprices[idx]= pper;
                  break;
                }
              }
              cdate+= 86400;
            }
            console.log('Ok done');
            console.log(aprices);
            try {
              cbs(aprices);
            } catch(e) {};
          });
      });
  });
}

_defSettings= {
  vatSettingsName: 'Vat taxes',
  vatSettingsPerc: '10',
  vatSettingsHeader: ''
}
function llGetPropertySettings(pid, cb) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('select * from psettings where id_property = ?', [pid], 
      function(ses, recs) {
        var dsets= _defSettings;
        if (recs.rows.length == 0) {
          sets= jQuery.extend({}, dsets);
          sets.defaultSettings= true;
        }
        else {
          var sets= recs.rows.item(0).settings;
          sets= JSON.parse(sets);
          for (var k in sets) dsets[k]= sets[k];
          dsets.defaultSettings= false;
          sets= dsets;
        }
        cb(ses, recs, sets);
      });
    });
}

function llNewInvoiceType(name, cb) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('insert into invoice_type (name) values (?)', [name], cb);
  });
}

function llModInvoiceType(iid, name, cb) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('update invoice_type set name = ? where id = ?', [name, iid], cb);
  });
}

function llGetItypes(cb) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    ses.executeSql('select id,name from invoice_type', [], cb);
  });
}

function llGetReservationInvoiceHeader(rid, cb) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    var qry= 'select customer.vat from customer join rcustomer on ';
    qry+= 'rcustomer.id_customer = customer.id join reservation on ';
    qry+= 'rcustomer.id_reservation = reservation.id where ';
    qry+= 'reservation.id = ? and rcustomer.maininvoice == 1';
    ses.executeSql(qry, [rid], cb);
  });
}

function llDelItype(iid, cb) {
  console.log('deleteing itype ' + iid);
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('delete from invoice_type where id = ?', [iid], cb);
  });
}

function llGetInvoice(rid, oid, cb) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    var d= {};
    if (oid) {
      d.qry= 'select occupancy.customer, invoice.* from occupancy left join invoice ';
      d.qry+= 'on occupancy.id = invoice.id_occupancy where occupancy.id = ?';
      d.qarr= [oid];
    } else {
      d.qry= 'select reservation.customer, invoice.* from reservation left join invoice ';
      d.qry+= 'on reservation.id = invoice.id_reservation where reservation.id = ?';
      d.qarr= [rid];
    }
    ses.executeSql(d.qry, d.qarr, function(ses, recs) {
      var ii= recs.rows.item(0);
      ii.html= $.base64Decode(ii.html);
      cb(ii);
    });
  });
}

function llNewVariation(vt, vl, vn, cb, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses, recs) {
    ses.executeSql('insert into price_function (value,vtype,name) values (?,?,?)', [vl,vt,vn], cb, cbe);
  });
}

function llGetVariations(vid, cb) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    if (!vid) 
      ses.executeSql('select * from price_function', [], cb);
    else
      ses.executeSql('select * from price_function where id = ?', [vid], cb);
  });
}

function llNewMeal(name, price, type, vat, cb, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('insert into meal (name,price,mtype,vat) values (?,?,?,?)', [name,price,type,vat], cb, cbe);
  });
}

function llGetMeals(mid, cb) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    if (!mid) 
      ses.executeSql('select * from meal', [], cb);
    else
      ses.executeSql('select * from meal where id = ?', [mid], cb);
  });
}

function llAssignCustomer(rid, cdict, mainInvoice, cb, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    sd= insertStatement(cdict);
    ses.executeSql('insert into customer ' + sd['qry'], sd['qarr'], 
      function(ses, recs) {
        var cid= recs.insertId;
        if (mainInvoice) var mainin= 1;
        else var mainin= 0;
        ses.executeSql('insert into rcustomer (id_customer,id_reservation,maininvoice) values (?,?,?)', 
                        [cid,rid,mainin],
          function(ses, recs) {
            if (mainin) 
              ses.executeSql('update rcustomer set maininvoice= 0 where id_customer != ? and id_reservation = ?', 
                [cid,rid], cb, cbe);
            else cb(ses, recs);
          }, 
          cbe);
      }, cbe);
  });
}

function llAssignExistingCustomer(rid, cid, cb, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('select id from rcustomer where id_customer = ? and id_reservation = ?',
      [cid,rid], function(ses, recs) {
        if (recs.rows.length == 0)
          ses.executeSql('insert into rcustomer (id_customer,id_reservation) values (?,?)', [cid,rid], cb, cbe);
        else cb(ses, recs);
      }, cbe);
  });
}

function llGetReservationCustomers(rid, cb) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    ses.executeSql('select * from customer join rcustomer on rcustomer.id_customer = customer.id where rcustomer.id_reservation = ?', [rid], cb);
  });
}

function llGetCustomer(cid, rid, cb) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    if (rid) {
      ses.executeSql('select customer.*,rcustomer.* from customer join rcustomer on rcustomer.id_customer = customer.id where customer.id = ? and rcustomer.id_reservation = ?', [cid, rid], cb);
      console.log('Loading reservatin customer');
      }
    else
      ses.executeSql('select * from customer where id = ?', [cid], cb);
  });
}

function llDelCustomer(cid, rid, cb, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    if (!rid) 
      ses.executeSql('delete from customer where id = ?', [cid], cb, cbe);
    else
      ses.executeSql('delete from rcustomer where id_customer = ? and id_reservation = ?', [cid, rid], cb, cbe);
  });
}

function llModCustomer(cid, cdict, rid, maininvoice, cb, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    var up= updateStatement(cdict);
    var upa= up.qarr;
    upa.push(cid);
    if (!rid) {
      ses.executeSql('update customer set ' + up.qry + ' where id = ?', upa, cb, cbe);
      return;
    }
    ses.executeSql('update customer set ' + up.qry + ' where id = ?', upa,
      function(ses, recs) {
        if (maininvoice) {
          ses.executeSql('update rcustomer set maininvoice = 0 where id_reservation =?', [rid],
            function(ses, recs) {
              ses.executeSql('update rcustomer set maininvoice = 1 where id_customer = ? and id_reservation =?', 
                [cid, rid], cb, cbe);
            }, cbe);
        } else {
          ses.executeSql('update rcustomer set maininvoice = 0 where id_customer = ? and id_reservation =?', 
            [cid, rid], cb, cbe);
        }
      }, cbe);
  });
}

function llGetInvoiceN(pid, it, cb) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    var now= jsDate();
    var year= now.getFullYear();
    var q= 'select max(n) as n from invoice join reservation on ';
    q+= 'reservation.id= invoice.id_reservation join property on ';
    q+= 'property.id = reservation.id_property where property.id = ? ';
    q+= 'and invoice.year = ? and invoice.id_invoice_type = ?';
    console.log(q);
    console.log([pid,year,it]);
    ses.executeSql(q, [pid, year, it],
      function(ses, recs) {
        console.log(recs);
        if (recs.rows.length == 0) {
          cb(1);
          return;
        }
        var n= parseInt(recs.rows.item(0).n);
        if (!n) {
          cb(1);return;
        }
        console.log('Last invoice: ' + n);
        cb(n+1);
      },
      function(ses, err) {
        console.log('Error getIn: ' + err.message);
        cb(1);
      });
  });
}

function llGetReservationInvoice(rid, cb, cbe) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    ses.executeSql('select * from invoice where id_reservation = ?', [rid], cb, cbe);
  });
}

function llGetAllCustomers(cb) {
  var db= zakOpenDb();
  db.readTransaction(function(ses) {
    ses.executeSql('select id,name,email from customer', [], cb);
  });
}

function llSaveInvoice(rid, html, n, head, chead, itype, cb, cbe) {
  var year= jsDate().getFullYear();
  var db= zakOpenDb();
  var h= $.base64Encode(html);
  db.transaction(function(ses) {
    var q= 'insert into invoice (n,html,id_reservation,year,head,chead,id_invoice_type) ';
    q+= 'values (?,?,?,?,?,?,?)';
    ses.executeSql(q, [n,h,rid,year,head,chead,itype], cb, cbe);
  });
}

function llChangeReservationStatus(rid, s, cb, cbe) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    console.log([s,rid]);
    ses.executeSql('update occupancy set status = ? where id_reservation = ?', [s,rid], 
      function(ses, recs) {
        ses.executeSql('update reservation set status = ? where id = ?', [s, rid], cb, cbe);
      }, 
      cbe);
  });
}

function llNewRoomTag(rid, tag, f, g) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('select * from room where id = ?', [rid], 
      function(ses, recs) {
        var room= recs.rows.item(0);
        var tags= room.tags || '';
        if (!tags) 
          tags= tag;
        else {
          var ltags= tags.split(',');
          if (ltags.indexOf(tag) > 0) {
            f();return;
          }
          tags+= ','+tag;
        }
        ses.executeSql('update room set tags = ? where id = ?', [tags, rid], f, g);
      },
      g);
  });
}

function llDelRoomTag(rid, tag, f, g) {
  var db= zakOpenDb();
  db.transaction(function(ses) {
    ses.executeSql('select * from room where id = ?', [rid], 
      function(ses, recs) {
        var room= recs.rows.item(0);
        var tags= room.tags || '';
        if (!tags) {
          f();return;
        }

        var ltags= tags.split(',');
        var newtags= [];
        for (var i= 0; i< ltags.length; i++) {
          var otag= ltags[i];
          if (otag != tag) newtags.push(otag);
        }
        ses.executeSql('update room set tags = ? where id = ?', [newtags, rid], f, g);
      },
      g);
  });
}
