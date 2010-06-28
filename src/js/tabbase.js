ZAK_TAB_LENGHT= 31;
ZAK_MAP_STATUS= {
  1: 'c', /* confirmed */
  2: 'n', /* not confirmed */
  3: 'i', /* checkin */
  4: 'p', /* preview */
}

addNewReservationDay= false;
addNewReservationRid= false;
delReservationOid= false;
delReservationRid= false;

function initDimensions() {
  try {
    var w= window.innerWidth;
    ZAK_TAB_LENGHT= parseInt((w - 140) / 30);
    console.log('ZAK_TAB_LENGHT: ' + ZAK_TAB_LENGHT);
  } catch(e) {}
}

function initZakDefaultDays(n) {
  var zakDaysDefaultArray= new Array();
  var i= 0;
  for(i=0;i<ZAK_TAB_LENGHT;i++) {
    zakDaysDefaultArray.push('v');
  }
  return zakDaysDefaultArray;
}


zakTableau= false;
function _setDateHead(d) {
  return $.datepicker.formatDate('d', d);
}
function getTableHeader(startingdate, lendays) {
  var now= jsDate(startingdate);
  var temp= false;
  /*var cdate= startingdate || new Date();*/
  var i= 0;
  var isToday= false;
  var isTodayDone= false;
  var clr= '';
  var res= '<th id="rMonth" style="background-color:black;color:white;width:45px;min-width:45px;max-width:45px">' + $.datepicker.formatDate('M', now) + '</th>';
  for(i=0; i< lendays;i++) {
    temp= dateAddDays(now, i);
    var wd= temp.getDay();
    if (!isTodayDone) {
      isToday= dateIsToday(temp);
      if (isToday == 0)  {
        clr= 'color:#bd0000;text-decoration:underline;';
        isTodayDone= 1;
      } else {
        if (isToday == 1) 
          isTodayDone= true;
        clr= '';
      }
    }
    if (wd == 0)
      res+= '<th style="background-color:#d0d0d0;' + clr + '">' + _setDateHead(temp) + '</th>';
    else if (wd == 6)
      res+= '<th style="background-color:#d6d6d6;' + clr + '">' + _setDateHead(temp) + '</th>';
    else
      res+= '<th style="' + clr + '">' + _setDateHead(temp) + '</th>';
    if (isToday == 0) 
      clr= '';
  }
  return res;
}

var iRoom= function(tableau, room) {
  this['tableau']= tableau;
  var rid= room['id'];
  this['id']= rid;
  this['name']= room['name'];
  this['code']= room['code'];
  /*this['days']= zakDaysDefaultArray.slice();*/
  this['occupancies']= new Array();

  this['getYourRow']= function() {
    var rid= this['id'];
    var res= '<tr id="room_' + rid + '" data-rid="'+ rid + '"></tr>';
    $('#tabtable').append(res);
  }

  this['addOccupancy']= function(occ) {
    this['occupancies'].push(occ);
  }

  this['getOccupancy']= function(oid) {
    var i= 0;
    for(i=0;i<this['occupancies'].length;i++) {
      var occ= this['occupancies'][i];
      if (parseInt(occ['id']) == oid) return occ;
    }
    return false;
  }

  this['delOccupancy']= function(oid) {
    var first= new Array();
    var i= 0;
    var olen= this['occupancies'].length;
    var occ= false;
    for(i=0;i<olen;i++) {
      occ= this['occupancies'][i];
      if (parseInt(occ['id']) != oid) first.push(occ);
      else console.log('Skipping occupancy :)');
    }
    this['occupancies']= first;
  }

  this['_designMe']= function() {
    var days= initZakDefaultDays(zakTableau.lendays);
    var occs= this['occupancies'];
    var ocllen= occs.length;
    var i= 0;
    var odfrom= 0;
    var odto= 0;
    var occ= false;
    var bidx= 0;
    var n= 0;
    var day= false;
    var stat= 1;
    var sstat= 'c';
    var osstat= 'c';
    var j=0;
    var tempmap= {};
    var overcycle= false;
    var beginPast= false;
    for(i=0;i<ocllen;i++) {
      overcycle= false;
      occ= occs[i];
      odfrom= occ['dfrom'];
      odto= occ['dto'];
      stat= occ['status'];
      sstat= ZAK_MAP_STATUS[stat];

      /* past occupancy */
      if (odfrom < unixDate(zakTableau.dfrom)) {
        /*console.log('Setting up past occupancy');*/
        n= diffDateDays(zakTableau.dfrom, odto);
        for(j=0;j<n;j++) {
          if (j >= zakTableau.lendays) break;
          days[j]= 'r' + sstat;
          tempmap[j]= occ;
        }
        if (j >= zakTableau.lendays || n >= zakTableau.lendays) continue;
        /* last day */
        day= days[n];
        /*tempmap[n]= occ;*/
        if (day.indexOf('v') == 0) {
          days[n]= 'e' + sstat;
        } else {
          osstat= days[n][1];
          if (osstat == sstat)
            days[bidx+n]= 'z' + sstat;
          else
            days[bidx+n]= 'z' + sstat + osstat;
        }
        continue;
      }

      /*console.log('Setting up occupancy');*/
      bidx= diffDateDays(zakTableau.dfrom, odfrom);
      n= diffDateDays(odfrom, odto) + 1;
      day= days[bidx];

      /* first day */
      if (day.indexOf('v') == 0) {
        days[bidx]= 'b' + sstat;
      } else {
        osstat= days[bidx][1];
        if (osstat == sstat)
          days[bidx]= 'z' + sstat;
        else
          days[bidx]= 'z' + osstat + sstat;
      }
      tempmap[bidx]= occ;

      /* internal days */
      for(j=1;j<n-1;j++) {
        if (j > zakTableau.lendays) {
          overcycle= true;
          break;
        }
        days[bidx + j]= 'r' + sstat;
        tempmap[bidx + j]= occ;
      }
      if (overcycle || (bidx + n -1 > zakTableau.lendays)) continue;

      /* last day */
      day= days[bidx+n-1];
      if (day.indexOf('v') == 0) {
        days[bidx+n-1]= 'e' + sstat;
      } else {
        osstat= days[bidx+n-1][1];
        if (osstat == sstat)
          days[bidx+n-1]= 'z' + sstat;
        else
          days[bidx+n-1]= 'z' + sstat + osstat;
      }
      /*tempmap[bidx+n-1]= occ;*/
    }
    return {tempmap: tempmap, days: days};
  }

  this['_menuDay']= function(day) {
    var s= '';
    if (day.indexOf('v') == 0) 
      return 'v menuv';
    if (day.indexOf('e') == 0)
      return day + ' menuv';
    if (day.indexOf('z') == 0 && day.length == 3) 
      s= day[2];
    else s= day[1];
    return day + ' menur' + s;
  }

  this['designMe']= function(ses, recs) {
    var d= this._designMe();
    var tempmap= d['tempmap'];
    var days= d['days'];
    var rid= this.id;
    var res= '<td style="width:45px" class="roomcode"><b>' + this.code + '</b></td>';
    var day= false;
    var occ= false;
    var i= 0;
    var menuclass= '';
    var imgdrag= '';
    var dataoid= '';
    var zdone= true;
    var j= 0;
    var cspan= 0;
    for (i=0;i<zakTableau.lendays;i++) {
      if (!zdone && i < j) continue;
      day= days[i];
      if (day.indexOf('v') == 0) {
        /* No Booking there */
        res+= '<td class="v menuv" data-day="' + i + '"></td>';
        continue;
        }
      menuclass= this._menuDay(day);
      occ= tempmap[i];
      if (!occ) occ = {id: -1};
      else 
        menuclass+= ' rsrv_' + occ['id_reservation'];
      dataoid= 'data-oid="' + occ['id'] + '" data-rid="' + occ['id_reservation'] + '"';
      /* let's handle begin,end, end-begin cases */
      if (day.indexOf('r') != 0) {
        if (day.indexOf('z') == 0 || day.indexOf('b') == 0)
          imgdrag= '<img data-rid="' + this.id + '" class="draggable" src="/imgs/mng/tbl/mv.png" ' + dataoid +'></img>';
        else imgdrag= '';
        if ( i-1 > 0 && tempmap[i-1])
          menuclass+= ' rsrv_'+tempmap[i-1]['id_reservation'];
        res+= '<td ' + dataoid + ' data-day="'+ i + '" class="' + menuclass + '">' + imgdrag + '</td>';
        continue;
      }
      j= i;
      cspan= 1;
      for (j=i+1;j<zakTableau.lendays;j++) {
        var oday= days[j]; 
        if (oday.indexOf('r') == 0) 
          cspan+= 1;
        else break;
      }
      /* a letter is 8 px, a td 28 */

      var space= (cspan * 28) / 7;
      try {
        var cust= occ['customer'];
        if (cust.length > space)
          cust= cust.substr(0, space);
      } catch(e) {console.log('Error customer: '+ e + '('+ocount+')');cust= 'Unkn.'};

      res+= '<td ' + dataoid + ' class="' + menuclass + '" data-day="' + i + '" colspan="' + cspan + '">'+cust+'</td>';
      zdone= false;
      j= i+ cspan;
    }
    $('#room_' + rid).empty();
    $('#room_' + rid).append(res);
  };
  return this;
}

var iTableau= function(dfrom, lendays, rids) {
  this['dfrom']= dfrom;
  this['lendays']= lendays || ZAK_TAB_LENGHT;
  this['rooms_enabled']= rids;
  $('#tabtableheader').empty().append(getTableHeader(dfrom, this.lendays));

  this['rooms']= {};

  this['designMe']= function(rooms, f) {
    if (!rooms) {
      for (var rid in this['rooms']) 
        this['rooms'][rid].designMe();
    } else {
      var i= 0;
      for(i=0;i<rooms.length;i++) {
        this['rooms'][rooms[i]].designMe();
      }
    }
    if (this.afterDesign) this.afterDesign();
  }

  this['roomEnabled']= function(rid, loadrids) {
    if (!loadrids && !this['rooms_enabled']) return true;
    var temp;
    if (loadrids) temp= loadrids;
    else temp= this['rooms_enabled'];
    var i;
    for(i=0;i<temp.length;i++) 
      if (parseInt(rid) == parseInt(temp[i])) return true;
    return false;
  }

  this['loadRooms']= function(loadrids, cbs) {
    llLoadRooms(getActiveProperty()['id'],
      function(ses, recs) {
        if (recs.rows.length == 0) return;
        var rids= new Array();
        var i= 0;
        for(i=0;i<recs.rows.length;i++) {
          var rroom= recs.rows.item(i);
          if (!zakTableau.roomEnabled(rroom['id'], loadrids)) {
            console.log('Skipping not included room:' + rroom['id']);
            continue;
          }
          console.log('Designing now room:' + rroom['id']);
          var iroom= zakTableau.rooms[rroom['id']]= new iRoom(zakTableau, rroom);
          iroom.getYourRow();
          rids.push(rroom['id']);
        }

        var udfrom= unixDate(zakTableau.dfrom);
        var jdfrom= jsDate(udfrom);
        var udto= unixDate(dateAddDays(jdfrom, zakTableau.lendays));

        var q= multipleSqlWhere(rids, 'id_room');
        var qry= q['qry'];
        qar= q['qar'];
        qar.push(udfrom);
        qar.push(udto);
        qar.push(udfrom);
        qar.push(udto);

        var s= 'select * from occupancy where (' + qry + ') and ';
        s+= '((dfrom >= ? and dfrom <= ?) or (dto >= ? and dto <= ?))';
        s+= ' order by dfrom';
        ses.executeSql(s, qar,
          function(ses, recs) {
            var i= 0;
            for(i=0;i<recs.rows.length;i++) {
              var occ= recs.rows.item(i);
              var rid= occ['id_room'];
              if (!zakTableau.roomEnabled(rid, loadrids)) continue;
              var ir= zakTableau.rooms[rid];
              ir.addOccupancy(occ);
            }
            console.log('Designing tableau');
            zakTableau.designMe(false);
            if (cbs) cbs();
          },
          function(ses, err) {
            humanMsg.displayMsg(err.message, 1);
          });

      },
      function(ses, err) {
        humanMsg.displayMsg(err.message, 1);
      }
    );
  }
  return this;
}
