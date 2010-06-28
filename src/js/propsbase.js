function setActiveProperty(prop, cbs, cbe) {
  if (parseInt(prop) != prop) {
    localStorage.activeProperty= JSON.stringify(prop);
    console.log('Active property to: ' + localStorage.activeProperty);
    return;
  }
  llGetProperties(
      function(ses, recs) {
        var i;
        console.log('Looking for right property');
        for(i=0;i<recs.rows.length;i++) {
          if (recs.rows.item(i)['id'] == prop) {
            console.log('Found right property');
            setActiveProperty(recs.rows.item(i));
            cbs();
          }
        }
      },
      function(ses, err) {
        humanMsg.displayMsg('Error selecting property: ' + err.message);
      });
}

function getActiveProperty() {
  try {
    return JSON.parse(localStorage.activeProperty);
  } catch(e) {return false;}
}
