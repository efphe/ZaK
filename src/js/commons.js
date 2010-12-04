ZAK_DB_NAME= 'zak';
ZAK_APP_NAME= 'Zak';
ZAK_DB_DISK= 1024 * 1024 * 50;

function goToSameDirPage(apage, delay) {
  if (!delay) return _goToSameDirPage(apage);
  setTimeout(function() {_goToSameDirPage(apage);}, delay);
}
function _goToSameDirPage(apage) {
  if (apage.indexOf('http') == 0) {
    window.location.href= apage;
    return;
  }
  var pname= window.location.pathname;
  var segs= pname.split('/');
  var slen= segs.length;
  if (slen == 0) {
    window.location.href= location.protocol + '//' + location.host + '/' + apage;
    return
  }
  var i;
  var rsegs= new Array();
  for(i=0;i<slen-1;i++) {
    if (segs[i]) rsegs.push(segs[i]);
  }
  rsegs.push(apage);
  window.location.href= location.protocol + '//' + location.host + '/' + rsegs.join('/');
  return;
}

function goToPage(apage) {
  window.location.href= location.protocol + '//' + location.host + '/' + apage;
}

function zakOpenDb(v, sync) {
  var dbv= v || '';
  if (sync) {
    alert(_('not implemented yet'));
    return -1;
  }
  var db= window.openDatabase(ZAK_DB_NAME, dbv, ZAK_APP_NAME, ZAK_DB_DISK);
  return db;
};

function _zakloop(tx, queries, cbs, cbe) {
  /*if (zakCountArrayDb == zakCountArrayNb ) return;*/
  /*console.log(queries);*/
  /*console.log(queries);*/
  /*return;*/
  var s= queries[zakCountArrayDb];
  /*console.log('Now query loop');*/
  /*console.log(s);*/
  zakCountArrayDb+= 1;
  if (zakCountArrayDb == zakCountArrayNb) {
    /*console.log(queries);*/
    tx.executeSql(s, new Array(), cbs, cbe);
  }
  else
    tx.executeSql(s, new Array(), function(tx, recs) {_zakloop(tx, queries, cbs, cbe)}, cbe);
};

function safeExecuteSql(ses, sql, params, scb) {
  ses.executeSql(sql, params, scb, function(ses, err) {var a= 1/0;});
}

function arrayQueries(ses, ssql, cbs, cbe) {
  var _queries= ssql.split(';;');
  var queries= [];
  for (var i= 0; i< _queries.length; i++) {
    var q= _queries[i];
    if (q.trim()) queries.push(q);
  }
  zakCountArrayDb= 0;
  zakCountArrayNb= queries.length;
  _zakloop(ses, queries, cbs, cbe);
}

function changeZakVersion(sqlstr, tov, cbs, cbe) {
  db= zakOpenDb();
  dbv= db.version;
  console.log('Migrating Version: ' + dbv + ' to ' + tov);
  db.changeVersion(dbv, tov, function(t) {
    arrayQueries(t, sqlstr, cbs, cbe);
  });
}

function displayError(err) {
  alert(err);
}

function displayGood(err) {
  alert(err);
}

function displayMsg(err, iserr) {
  if (iserr) displayGood(err);
  else displayError(err);
}

if (window.opera && !window.console) {
    window.console = {};
    var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
    "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];
    for (var i = 0; i < names.length; ++i)
        window.console[names[i]] = function() {}
    window.console.info = function() {
        opera.postError(arguments);
    }
}

function zakFrameBufferMsg(msg) {
  var cnt= '<b>' + msg + '</b>... ';
  $('#framebuffer').append(cnt);
}
function zakFrameBufferSt(st) {
  if (st) 
    var cnt= '[ <b style="color:red">Error</b> ]<br/>';
  else
    var cnt= '[ <b style="color:green">Ok</b> ]<br/>';
  $('#framebuffer').append(cnt);
}

function multipleSqlWhere(warray, keyname, anded) {
  var ftrcodes= new Array();
  var qarray= new Array();
  var i= 0;
  for(i=0;i<warray.length;i++) {
    ftrcodes.push(keyname + ' = ?');
    qarray.push(warray[i]);
  }
  if (!anded) 
    var of= ftrcodes.join(' or ');
  else
    var of= ftrcodes.join(' and ');
  return {qry: of, qar: qarray}
}

function selectPropertiesInit() {
  llGetProperties(
    function(ses, props) {
      var res= '';
      var i= 0;
      var aprop= getActiveProperty();
      /*console.log('Selecting with active= ' + aprop);*/
      $('.putPropertyname').each(function(idx, el) {
        $(this).append(aprop['name'] || _('Property'));
      });
      var aid= aprop['id'];
      for(i=0;i<props.rows.length;i++) {
        var prop= props.rows.item(i);
        if (prop['id'] == aid) {
          res+= '<option selected="selected" value="' + prop['id'] + '">' + prop['name'] + '</option>';
        }
        else
          res+= '<option value="' + prop['id'] + '">' + prop['name'] + '</option>';
      }
      $('#selectproperty').empty().append(res).change(function() {
        var zcode= $('#selectproperty').val();
        if (getActiveProperty()['id'] != zcode) {
          setActiveProperty(zcode, function() {document.location.reload(false);});
        }
      });
    },
    function(ses, err) {
      humanMsg.displayMsg('Error Select Properties', 1);
    }
  );
}

function zakNotImplementedYet() {
  el= document.getElementById('zakNotImplementedYet');
  if (!el) {
    var htmltoshow= '<div id="zakNotImplementedYet" class="zakmodal">' +
      '<h1>'+_('not implemented yet')+'</h1> ' +
      '<h2>'+_('Feature actually not available')+'</h2>' +
      _('Sorry: this feature has not been implemented yet. We will release it as soon as possible') +
      '<br/>' +
      '<br/>' +
      '<a style="color:#36ff00;font-weight:bold" href="javascript:$.modal.close()">Continue</a>' +
    '</div>';
    $(document.body).append(htmltoshow);
  }
  $('#zakNotImplementedYet').modal();
}

function checkFloat(x){
  var t= '^\[0-9]+(\.\?[0-9]+)?$';
  var xx= x + '';
  if (xx.search(t) == -1) return false;
  return true;
}

function updateStatement(d, ekeys) {
  var qry, qarr= new Array();
  var temp= new Array();
  for (var k in d) {
    if (ekeys && ekeys.indexOf(k) >= 0) continue;
    temp.push(k + '= ?');
    qarr.push(d[k]);
  }
  return {qarr: qarr, qry: temp.join(',')};
}

function updateStatementWhere(d, where, wherearr, tbl, ekeys) {
  var ekeys= ekeys || [];
  var o= updateStatement(d, ekeys);
  o.qry= 'update ' + tbl + ' set ' + o.qry + ' ' + where;
  for (var i=0; i < wherearr.length; i++ )
    o.qarr.push(wherearr[i]);
  return o;
}

function insertStatement(d, ekeys) {
  var keys= [];
  var vals= [];
  var dots= [];
  var ekeys= ekeys || [];
  for (var k in d) {
    if (ekeys && ekeys.indexOf(k) >= 0) continue;
    keys.push(k);
    vals.push(d[k]);
    dots.push('?');
  }
  var q= '(' + keys.join(',') + ') values (' + dots.join(',') + ')';
  return {qarr: vals, qry: q};
}

function insertStatementWhere(d, t, ekeys) {
  var o= insertStatement(d, ekeys);
  o.qry= 'insert into ' + t + ' ' + o.qry;
  return o;
}

function arrayFromRecords(r) {
  var i, res= [];
  for(i=0;i<r.rows.length;i++) {
    res.push(r.rows.item(i));
  }
  return res;
}

function dictFromRecords(r) {
  var i, res= {}, it;
  for(i=0;i<r.rows.length;i++) {
    it= r.rows.item(i);
    res[it['id']]= it;
  }
  return res;
}

function copyObject(d, skipfields) {
  var no= {};
  for (var k in d) {
    if (!skipfields || skipfields.indexOf(k) == -1)
      no[k]= d[k];
  }
  return no;
}

function strObject(d) {
  for (var k in d) {
    console.log(k + '= ' + d[k]);
  }
}

function addArray(src, dst) {
  for (var i=0;i<dst.length;i++) {
    src.push(dst[i]);
  }
}

function getPropertySettings(cb) {
  llGetPropertySettings(getActiveProperty()['id'], cb);
}

function getCurrency() {
  var cur= getActiveProperty()['currency'];
  if (cur == 1) return '&#8364;';
  if (cur == 2) return '$';
  if (cur == 3) return '&#163;';
  return cur;
}

function zakCheckMail(email) {
  var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;  
  return emailPattern.test(email);  
}

function obLen(ob) {
  var res= 0;
  for (var k in ob) res+= 1;
  return res;
}

function zakSleep(delay) {
  var start = new Date().getTime();
  while (new Date().getTime() < start + delay);
}

function zakSelect(o, s, sid) {
  var res= '';
  if (sid) res+= '<select id="' + sid + '">';
  for (var k in o) {
    if (s == k)
      res+= '<option selected="selected" value="' + k + '">' + o[k] + '</option>';
    else
      res+= '<option value="' + k + '">' + o[k] + '</option>';
  }
  if (sid) res+= '</select>';
  return res;
}
function zakSelectL(o, s, sid) {
  var res= '';
  if (sid) res+= '<select id="' + sid + '">';
  for (var i= 0; i< o.length; i++) {
    var vl= o[i];
    if (s == k)
      res+= '<option selected="selected" value="' + vl + '">' + vl + '</option>';
    else
      res+= '<option value="' + vl + '">' + vl + '</option>';
  }
  if (sid) res+= '</select>';
  return res;
}
