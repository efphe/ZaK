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
