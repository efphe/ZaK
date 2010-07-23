create table if not exists property ( 
  id integer primary key asc, 
  name text, 
  active integer default 0
);; 
CREATE TRIGGER if not exists property_d
BEFORE DELETE ON property  
FOR EACH ROW BEGIN  
    DELETE FROM room WHERE room.id_property = OLD.id;  
    DELETE from reservation where reservation.id_property= OLD.id; 
    DELETE from psettings where psettings.id_property = OLD.id;
    delete from invoice where id_property= OLD.id; 
END;; 
create table psettings (
  id integer primary key asc,
  settings text,
  id_property integer, 
  foreign key(id_property) references property(id) on delete cascade 
);;
create table if not exists pricing (
  id integer primary key asc,
  name text not null,
  price_ro float,
  price_fb float,
  price_hb float,
  price_bb float
);;
CREATE TRIGGER if not exists pricing_d
BEFORE DELETE ON pricing  
FOR EACH ROW BEGIN  
    DELETE FROM pricing_periods WHERE pricing_periods.id_pricing = OLD.id;  
    UPDATE reservation set id_pricing = null where reservation.id_pricing = OLD.id;
END;; 
create table if not exists pricing_periods (
  id integer primary key asc,
  dfrom integer,
  dto integer,
  price_ro float,
  price_fb float,
  price_hb float,
  price_bb float,
  id_pricing integer,
  foreign key(id_pricing) references pricing(id) on delete cascade 
);;
create table if not exists room ( 
  id integer primary key asc, 
  code text, 
  id_property integer, 
  name text, 
 
  unique (code,id_property), 
  foreign key(id_property) references property(id) on delete cascade 
);; 
CREATE TRIGGER if not exists room_d
BEFORE DELETE ON room  
FOR EACH ROW BEGIN  
    delete from occupancy where id_room = OLD.id;  
END;; 
create table if not exists room_setup ( 
  id integer primary key asc, 
  name text 
);; 
CREATE TRIGGER if not exists room_setup_d
BEFORE DELETE ON room_setup  
FOR EACH ROW BEGIN  
    update occupancy set id_room_setup= null where occupancy.id_room_setup = OLD.id; 
END;; 
create table if not exists customer (
  id integer primary key asc,
  customer text not null,
  first_name text default '',
  last_name text default '',
  email text default '',
  phone text default '',
  vat text default '',
  street text default '',
  city text default '',
  male integer default 1,
  country text default '--'
);;
CREATE TRIGGER if not exists customer_d
BEFORE DELETE ON customer  
FOR EACH ROW BEGIN  
  delete from rcustomer where id_customer = OLD.id;
END;; 
create table if not exists reservation ( 
  id integer primary key asc, 
  customer text, 
  dfrom integer, 
  dto integer, 
  status smallint, 
  id_property integer, 
  remarks text default '', 
  extras text default '',
  custom_pricing text default '',
  meal default 'bb',
 
  foreign key(id_property) references property(id) on delete cascade 
);; 
CREATE TRIGGER if not exists reservation_d
BEFORE DELETE ON reservation 
FOR EACH ROW BEGIN  
    delete from occupancy where id_reservation= OLD.id; 
    delete from invoice where id_reservation= OLD.id; 
    delete from rcustomer where id_reservation= OLD.id; 
END;; 
create table if not exists rcustomer (
  id integer primary key asc, 
  zakid text not null,
  id_customer integer not null,
  id_reservation integer not null,
  primary key(id),
  foreign key(id_customer) references customer(id) on delete cascade,
  foreign key(id_reservation) references reservation(id) on delete cascade
);;
create table if not exists occupancy ( 
  id integer primary key asc, 
  customer text, 
  status smallint, 
  dfrom integer, 
  dto integer, 
  id_reservation integer, 
  id_room integer, 
  remarks text, 
  id_room_setup integer default null, 
  occupancy text,
  invoiced integer default 0,
 
  foreign key(id_room_setup) references room_setup(id) on delete set null, 
  foreign key(id_room) references room(id) on delete cascade, 
  foreign key(id_reservation) references reservation(id) on delete cascade 
);; 
CREATE TRIGGER if not exists occupancy_d
BEFORE DELETE ON occupancy 
FOR EACH ROW BEGIN  
    delete from invoice where id_occupancy= OLD.id; 
END;; 
create table if not exists extra (
  id integer primary key asc,
  name text,
  cost float
);;
create table invoice_type (
  id integer primary key asc,
  name text
);;
create trigger if not extra invoice_type_d
before delete on invoice_type for each row begin
  update invoice set id_invoice_type = null where id_invoice_type = OLD.id;
end;;
create table if not exists invoice (
  id integer primary key asc,
  n integer,
  id_property integer,
  id_reservation integer,
  id_occupancy integer default null,
  icustomer text,
  idate text,
  ivat text,
  iheader text,
  id_invoice_type integer,
  foreign key(id_invoice_type) references invoice_type(id) on delete set null,
  foreign key(id_reservation) references reservation(id) on delete cascade,
  foreign key(id_occupancy) references occupancy(id) on delete cascade,
  foreign key(id_property) references property(id) on delete cascade 
);;
