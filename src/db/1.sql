create table if not exists property ( 
  id integer primary key asc, 
  name text, 
  rooms integer, 
  active integer default 0, 
  zakcode integer, 
  revision integer 
);; 
CREATE TRIGGER if not exists property_deletion 
BEFORE DELETE ON property  
FOR EACH ROW BEGIN  
    DELETE FROM room WHERE room.id_property = OLD.id;  
    DELETE from reservation where reservation.id_property= OLD.id; 
END;; 
create table if not exists pricing (
  id integer primary key asc,
  name text not null,
  price_ro float,
  price_fb float,
  price_hb float,
  price_bb float
);;
CREATE TRIGGER if not exists pricing_deletion 
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
  price real, 
 
  unique (code,id_property), 
  foreign key(id_property) references property(id) on delete cascade 
);; 
CREATE TRIGGER if not exists room_deletion  
BEFORE DELETE ON room  
FOR EACH ROW BEGIN  
    delete from occupancy where id_room = OLD.id;  
END;; 
create table if not exists room_setup ( 
  id integer primary key asc, 
  name text 
);; 
CREATE TRIGGER if not exists room_setup_deletion 
BEFORE DELETE ON room_setup  
FOR EACH ROW BEGIN  
    update occupancy set id_room_setup= null where occupancy.id_room_setup = OLD.id; 
END;; 
create table if not exists reservation ( 
  id integer primary key asc, 
  customer text, 
  dfrom integer, 
  dto integer, 
  status smallint, 
  id_property integer, 
  id_pricing integer default null,
  remarks text default '', 
  extras text default '',
  custom_pricing text default '',
 
  foreign key(id_property) references property(id) on delete cascade 
);; 
CREATE TRIGGER if not exists reservation_deletion 
BEFORE DELETE ON reservation 
FOR EACH ROW BEGIN  
    delete from occupancy where id_reservation= OLD.id; 
    delete from reservation_invoice where id_reservation= OLD.id; 
END;; 
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
CREATE TRIGGER if not exists occupancy_deletion 
BEFORE DELETE ON occupancy 
FOR EACH ROW BEGIN  
    delete from reservation_invoice where id_occupancy= OLD.id; 
END;; 
create table if not exists extra (
  id integer primary key asc,
  name text,
  cost float
);;
create table if not exists reservation_invoice (
  id integer primary key asc,
  n integer,
  html text,
  created integer,
  id_property integer,
  id_reservation integer,
  id_occupancy integer default null,
  foreign key(id_reservation) references reservation(id) on delete cascade,
  foreign key(id_occupancy) references occupancy(id) on delete cascade 
  foreign key(id_property) references property(id) on delete cascade 
);;
