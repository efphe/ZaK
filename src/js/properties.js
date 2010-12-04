_rcodes= {};
function repeatedRoomCode(code, rid) {
  var rcode;
  for (var rrid in _rcodes) {
    rcode= _rcodes[rrid];
    if (code == rcode && rid != rrid) return true;
  }
  return false;
}

function _roomTd(room, rtype, tags) {
  var rname= room.name;
  var rcode= room.code;
  var rid= room.id;
  var rtypeid= room.id_room_type;
  var res= '<td>' + rname + '</td><td>' + rcode + '</td><td>' + rtype + '</td>';
  res+= '<td><a href="javascript:delRoom(\'' + rid + '\')">' + _('Delete')+ '</a></td>';
  var args= [rid,rname,rcode,rtypeid].join("','");
  args= "'" + args + "'";
  res+= '<td><a href="javascript:askModRoom(' + args + ')">'+_('Modify')+'</a></td>';
  /*var tags= room.tags;*/
  if (!tags) {
    res+= '<td>no tag</td>';
  } else {
    res+= '<td>';
    /*tags= tags.split(',');*/
    for (var i= 0; i< tags.length; i++) {
      var t= tags[i];
      res+= '<b class="tagging">' + t + ' <a href="javascript:void(0)" onclick="delRoomTag(' + rid + ', \'' + t +'\')">X</a></b>';
    }
    res+= '</td>';
  }
  res+= '<td><input class="rooms_tagging" id="tag_'+rid+'" onkeypress="return newRoomTag(event)" type="text" style="width:60px"/></td>';
  return '<tr>' + res + '</tr>';
}

function _newRoomTag(rid, tag) {
  llNewRoomTag(rid, tag, function(ses, recs) {;
    initRooms(1);
    humanMsg.displayMsg('Sounds great');
    }, function(ses, err) {
      humanMsg.displayMsg('Error: '+ err.message, 1);
  });
  return false;
}

function newRoomTag(ev) {
  if (ev.keyCode != 13) return;
  try {
    console.log(ev);
    var el= $(ev.target);
    var tname= el.val();
    var rid= el.attr('id').split('_')[1];
    return _newRoomTag(rid, tname);
  } catch(e) {console.log(e)}
  return false;
}

function delRoomTag(rid, tag) {
  console.log(rid);
  console.log(tag);
  llDelRoomTag(rid, tag, function(ses, recs) {
    initRooms(1);
    humanMsg.displayMsg('Sounds great');
    }, function(ses, err) {
      humanMsg.displayMsg('Error: '+ err.message, 1);
    });
}

function askModRoom(rid, rname, rcode, rtype) {
  modroom= rid;
  $('#modroom_name').val(rname);
  $('#modroom_code').val(rcode);
  $('#modroom_code').val(rcode);
  $('#modroom_rtype').val(rtype);
  $('#modRoom').modal();
}

function modRoom() {
  var rid= modroom;
  var rname= $('#modroom_name').val();
  var rcode= $('#modroom_code').val();
  var rtype= $('#modroom_rtype').val();
  if (repeatedRoomCode(rcode, rid)) {
    humanMsg.displayMsg(_('Room code specified already in use'), 1);
    return;
  }
  if (rtype) {
    llModRoom(rid, rname, rcode, rtype,
      function(ses, recs) {
        initRooms(1);
        humanMsg.displayMsg('Sounds good');
        $.modal.close();
      },
      function(ses, err) {
        humanMsg.displayMsg('Error: ' + err.message, 1);
      });
    return;
  }
  var newtypename= $('#modroom_newtype').val();
  if (!newtypename) {
    humanMsg.displayMsg(_('Please, specify a valid room type'));
    return;
  }
  llUpdRoomAndType(rid, rname, rcode, newtypename,
      function(ses, recs) {
        designRoomTypes();
        initRooms(1);
        humanMsg.displayMsg('Sounds good');
        $.modal.close();
      },
      function(ses, err) {
        humanMsg.displayMsg('Error: ' + err.message, 1);
      });
}

function askNewRoomType() {
  $('#askRoomType').modal();
}

function designRoomTypes() {
  var res= '<option value="">'+_('New')+'</option>';
  llGetRoomTypes(function(ses, recs) {
    for (var i= 0;i < recs.rows.length;i ++) {
      var rec= recs.rows.item(i);
      res+= '<option value="' + rec.id + '">' + rec.name + '</option>';
    }
    $('.newroomtype').empty().append(res);
  });
}

function addNewRoomWithType() {
  var rname= $('#tempnewroomname').val();
  var rcode= $('#tempnewroomcode').val();
  var rtype= $('#rtype').val();
  console.log('Rtype: ' + rtype);
  if (!rname || !rcode) {
    humanMsg.displayMsg(_('Please, insert a room name and a Unique Room Code'), 1);
    return;
  }
  if (repeatedRoomCode(rcode)) {
    humanMsg.displayMsg(_('Room code specified already in use'), 1);
    return;
  }
  llGetRoomTypes(function(ses, recs) {
    console.log('In');
    console.log(recs);
    for (var i= 0;i< recs.rows.length; i++) {
      if (recs.rows.item(i).name == rtype) {
        var rec= recs.rows.item(i);
        llNewRoom(getActiveProperty()['id'], rcode, rname, rec.id,
          function(ses, recs) {
            var rid= recs.insertId;
            initRooms(1);
            _rcodes[rid]= rcode;
            humanMsg.displayMsg('Sounds Good!');
            $.modal.close();
          },
          function(ses, err) {
            humanMsg.displayMsg('Error there: ' + err.message);
          });
        return;
      }
    }

    llNewRoomAndType(getActiveProperty()['id'], rcode, rname, rtype,
      function(ses, recs) {
        var rid= recs.insertId;
        initRooms(1);
        _rcodes[rid]= rcode;
        humanMsg.displayMsg('Sounds Good!');
        designRoomTypes();
        $.modal.close();
      },
      function(ses, err) {
        humanMsg.displayMsg('Error there: ' + err.message);
      });
    }, function(ses, err) {
      humanMsg.displayMsg('Error there: ' + err.message);
    });
}

function addNewRoom() {
  var rname= $('#newroomname').val();
  var rcode= $('#newroomcode').val();
  if (!rname || !rcode) {
    humanMsg.displayMsg(_('Please, insert a room name and a Unique Room Code'), 1);
    return;
  }
  if (repeatedRoomCode(rcode)) {
    humanMsg.displayMsg(_('Room code specified already in use'), 1);
    return;
  }
  var rtype= $('#newroomtype').val();
  if (!rtype) {
    $('#tempnewroomname').val(rname);
    $('#tempnewroomcode').val(rcode);
    askNewRoomType();
    return;
  }
  llNewRoom(getActiveProperty()['id'], rcode, rname, rtype,
    function(ses, recs) {
      var rid= recs.insertId;
      initRooms(1);
      _rcodes[rid]= rcode;
      humanMsg.displayMsg('Sounds Good!');
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message, 1);
    });
}

function delRoom(rid) {
  roomtobedelted= rid;
  $('#delRoomAlert').modal();
}
function _delRoom() {
  $.modal.close();
  var rid= roomtobedelted;
  llDeleteRooms(getActiveProperty()['id'], [rid], 
    function(ses, recs) {
      humanMsg.displayMsg('Sounds Good!');
      initRooms(1);
    },
    function(ses, err) {
      humanMsg.displayMsg('Cannot delete :/ Error: ' + err.message, 1);
    });
}

function askDelProperty() {
  $('#delPropertyAlert').modal();
}

function _delProperty() {
  var pid= getActiveProperty()['id'];
  llDelProperty(pid,
    function(ses, err) {
      humanMsg.displayMsg('All\'s ok');
      setActiveProperty(false);
      document.location.reload(false);
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message);
    });
}

function initRooms(reset) {
  _rcodes= {};
  if (reset) $('#roomsbody').empty();
  var pid= parseInt(getActiveProperty()['id']);
  var alltags= [];
  llGetRoomTypes(function(ses, recs) {
    var rmap= {};
    for (var i= 0; i< recs.rows.length; i++) {
      var rt= recs.rows.item(i);
      rmap[rt.id]= rt.name;
    }
    console.log(rmap);

    llLoadRooms(pid,
      function(ses, recs) {
        var alltags= [];
        var i= 0;
        var res= '';
        for(i=0;i<recs.rows.length;i++) {
          var room= recs.rows.item(i);
          /*var rname= room.name;*/
          var rcode= room.code;
          var rid= room.id;
          var tags= room.tags || '';
          if (tags) tags= tags.split(',');
          else tags= [];
          for (var j=0;j<tags.length;j++) {
            if (alltags.indexOf(tags[j]) == -1) alltags.push(tags[j]);
          }
          res+= _roomTd(room, rmap[room.id_room_type], tags);
          _rcodes[rid]= rcode;
        }
        $('#roomsbody').html(res);
        $('.rooms_tagging').autocomplete(
        {
          source: alltags,
          minLength: 1,
          select: function(event, ui) {
            var rid= $(this).attr('id').split('_')[1];
            var v= ui.item.value;
            console.log(rid);
            console.log(v);
            _newRoomTag(rid, v);
          }
        });
      },
      function(ses, err) {
        alert(err);
      });
    });
}

function modRoomType() {
  if (!$('#modroom_rtype').val()) $('#showNewType').show();
  else $('#showNewType').hide();
}

function addNewProperty() {
  var propname= $('#newpropertyname').val();
  var currency= $('#newpropertycur').val();
  if(!propname) {
    humanMsg.displayMsg(_('Please, insert a valid property name'), 1);
    return;
  }
  llNewProperty(propname, currency,
    function(ses, recs) {
      var pid= recs.insertId;
      humanMsg.displayMsg('New property ' + propname + ': Done!');
      setActiveProperty(pid, function() {document.location.reload(false)});;
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: '+ err.message, 1);
    });
}

function askNewProperty() {
  $('#newProperty').modal({onClose: function() {
    if (!getActiveProperty()) {
      $('#newProperty').modal();
      }
    }});
}

function initProperties() {
  designRoomTypes();
  llGetProperties(
    function(ses, recs) {
      if (recs.rows.length < 1) {
        askNewProperty();
        return;
      }
      if (!getActiveProperty()) {
        setActiveProperty(recs.rows.item(0));
      }
      initRooms();
    },
    function(ses, err) {
      humanMsg.displayMsg('Error: ' + err.message, 1);
    });
}

$(document).ready(function() {
  initProperties();
});

