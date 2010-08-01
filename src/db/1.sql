create table property ( 
  id integer primary key asc, 
  name text, 
  active integer default 0
);; 
create table psettings (
  id integer primary key asc,
  settings text,
  id_property integer, 
  foreign key(id_property) references property(id) on delete cascade 
);;
create table pricing (
  id integer primary key asc,
  name text not null,
  prices text
);;
create table pricing_periods (
  id integer primary key asc,
  dfrom integer,
  dto integer,
  prices text,
  id_pricing integer,
  foreign key(id_pricing) references pricing(id) on delete cascade 
);;
create table price_function (
  id integer primary key asc,
  value float,
  -- vtype = 1 -> percentage
  -- vtype = 2 -> fix per day
  -- vtype = 3 -> fix global
  name text,
  vtype integer default 0
);;
create table meal (
  id integer primary key asc,
  -- vtype = 1 -> bb
  -- vtype = 2 -> hb
  -- vtype = 3 -> fb
  name text,
  price float,
  mtype integer,
  vat float
);;
create table room_type (
  id integer primary key asc,
  name text
);;
create table room ( 
  id integer primary key asc, 
  code text, 
  id_property integer, 
  id_room_type integer not null,
  name text, 
 
  unique (code,id_property), 
  foreign key(id_room_type) references room_type(id) on delete set null,
  foreign key(id_property) references property(id) on delete cascade 
);; 
create table room_setup ( 
  id integer primary key asc, 
  name text 
);; 
create table customer (
  id integer primary key asc,
  name text not null,
  country text default '',
  country_code text default '',
  city text default '',
  address text default '',
  zip text default '',
  bmonth integer default 1,
  byear text default '',
  bplace text default '',
  gender integer default 1,
  email text default '',
  phone text default '',
  notes text default '',
  vat text default ''
);;
create table reservation ( 
  id integer primary key asc, 
  customer text, 
  dfrom integer, 
  dto integer, 
  status smallint, 
  id_property integer, 
  remarks text default '', 
  extras text default '',
  custom_pricing text default '',
  meals text default '',
 
  foreign key(id_property) references property(id) on delete cascade 
);; 
create table rcustomer (
  id integer primary key asc, 
  id_customer integer not null,
  id_reservation integer not null,
  maininvoice integer default 0,
  foreign key(id_customer) references customer(id) on delete cascade,
  foreign key(id_reservation) references reservation(id) on delete cascade
);;
create table occupancy ( 
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
create table extra (
  id integer primary key asc,
  name text,
  perday integer default 0,
  vat float,
  cost float
);;
create table invoice_type (
  id integer primary key asc,
  name text
);;
create table invoice (
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
-- triggers --
create trigger property_d
before delete on property for each row begin  
    delete from room WHERE room.id_property = OLD.id;  
    delete from reservation where reservation.id_property= OLD.id; 
    delete from psettings where psettings.id_property = OLD.id;
    delete from invoice where id_property= OLD.id; 
end;; 
create trigger pricing_d
before delete on pricing  
for each row begin  
    delete from pricing_periods WHERE pricing_periods.id_pricing = OLD.id;  
end;; 
create trigger room_d
before delete on room  
for each row begin  
    delete from occupancy where id_room = OLD.id;  
end;; 
create trigger room_setup_d
before delete on room_setup  
for each row begin  
    update occupancy set id_room_setup= null where occupancy.id_room_setup = OLD.id; 
end;; 
create trigger customer_d
before delete on customer  
for each row begin  
  delete from rcustomer where id_customer = OLD.id;
end;; 
create trigger reservation_d
before delete on reservation 
for each row begin  
    delete from occupancy where id_reservation= OLD.id; 
    delete from invoice where id_reservation= OLD.id; 
    delete from rcustomer where id_reservation= OLD.id; 
end;; 
create trigger occupancy_d
before delete on occupancy 
for each row begin  
    delete from invoice where id_occupancy= OLD.id; 
end;; 
create trigger invoice_type_d
before delete on invoice_type for each row begin
  update invoice set id_invoice_type = null where id_invoice_type = OLD.id;
end;;
