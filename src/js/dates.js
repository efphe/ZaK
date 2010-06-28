function _dateFromCoord(y,m,d) {
  return new Date(parseInt(Math.round(y)), parseInt(Math.round(m)) - 1, parseInt(Math.round(d)));
}
function _dateFromStr(s) {
  var t= s.split('/');
  return _dateFromCoord(t[2], t[1], t[0]);
}
function unixDate(d, fmt, imperfect) {
  if(!d) {
    var dd= new Date();
    return unixDate(dd, fmt, imperfect);
  }
  if (typeof(d) == 'number') return d;
  if (typeof(d) == 'string') {
    var dd= _dateFromStr(d);
  } else {
    if (imperfect) {
      var dd= new Date();
      dd.setTime(d.getTime());
    } else
      var dd= new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  return Math.round(dd.getTime() / 1000);
}

function jsDate(d, fmt) {
  if (!d) {
    var dd= new Date();
    return jsDate(dd, fmt);
  }
  if (typeof(d) == 'number') {
    var dd= new Date();
    dd.setTime(d * 1000);
    return dd;
  }
  if (typeof(d) == 'string') {
    return _dateFromStr(d);
  }
  var dd= new Date();
  dd.setTime(d.getTime());
  return dd;
}

function strDate(d, fmt) {
  if (!d) {
    var dd= new Date();
    return strDate(dd, fmt);
  }
  var tfmt= fmt || 'dd/mm/yy';
  var jd= jsDate(d);
  return $.datepicker.formatDate(tfmt, jd);
}

function diffDateDays(a, b) {
  var ua= unixDate(a);
  var ub= unixDate(b);
  return Math.round(Math.abs(ub-ua) / 86400);
}

function dateAddDays(d, days) {
  var dd= jsDate(d);
  dd.setDate(dd.getDate() + parseInt(days));
  return dd;
}

function dateIsToday(d) {
  /* returns 1 if today is in the past, -1 if today is in the future, 0 otherwise */
  var dd= unixDate(d);
  var today= unixDate();
  if (today == dd) return 0;
  if (today > dd) return -1;
  return 1;
}
