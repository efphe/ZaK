gw:
	/usr/bin/twistd -noy gateway.py
pyclean:
	for i in `find . -name \*pyc`; do rm $$i; done

SRCJSDIR=src/js

PGPROPS= $(SRCJSDIR)/cm/j.js $(SRCJSDIR)/commons.js \
		 $(SRCJSDIR)/ll.js $(SRCJSDIR)/propsbase.js $(SRCJSDIR)/properties.js
$(SRCJSDIR)/cm/pgprops.js: $(PGPROPS)
	cat $^ > temp.uncompressed
	jszip temp.uncompressed $@
	rm temp.uncompressed

PGTAB= $(SRCJSDIR)/cm/j.js $(SRCJSDIR)/commons.js $(SRCJSDIR)/propsbase.js \
	   $(SRCJSDIR)/ll.js $(SRCJSDIR)/dates.js $(SRCJSDIR)/tabbase.js $(SRCJSDIR)/tab.js
$(SRCJSDIR)/cm/pgtab.js: $(PGTAB)
	cat $^ > temp.uncompressed
	jszip temp.uncompressed $@
	rm temp.uncompressed

PGRES= $(SRCJSDIR)/cm/j.js $(SRCJSDIR)/commons.js $(SRCJSDIR)/propsbase.js \
	   $(SRCJSDIR)/ll.js $(SRCJSDIR)/tabbase.js $(SRCJSDIR)/resbase.js \
	   $(SRCJSDIR)/reservation.js $(SRCJSDIR)/jquery/jquery.bgiframe.min.js $(SRCJSDIR)/lcountries.js
$(SRCJSDIR)/cm/pgres.js: $(PGRES)
	cat $^ > temp.uncompressed
	jszip temp.uncompressed $@
	rm temp.uncompressed

PGINIT= $(SRCJSDIR)/cm/j.js $(SRCJSDIR)/commons.js $(SRCJSDIR)/init.js
$(SRCJSDIR)/cm/pginit.js: $(PGINIT)
	cat $^ > temp.uncompressed
	jszip temp.uncompressed $@
	rm temp.uncompressed

PGPRICES= $(SRCJSDIR)/cm/j.js $(SRCJSDIR)/commons.js $(SRCJSDIR)/dates.js \
		 $(SRCJSDIR)/ll.js $(SRCJSDIR)/propsbase.js $(SRCJSDIR)/pricing.js
$(SRCJSDIR)/cm/pgpricing.js: $(PGPRICES)
	cat $^ > temp.uncompressed
	jszip temp.uncompressed $@
	rm temp.uncompressed

PGSEARCH= $(SRCJSDIR)/cm/j.js $(SRCJSDIR)/commons.js $(SRCJSDIR)/ll.js \
		  $(SRCJSDIR)/propsbase.js $(SRCJSDIR)/llsearch.js $(SRCJSDIR)/search.js
$(SRCJSDIR)/cm/pgsearch.js: $(PGSEARCH)
	cat $^ > temp.uncompressed
	jszip temp.uncompressed $@
	rm temp.uncompressed

PGINV= $(SRCJSDIR)/cm/j.js $(SRCJSDIR)/commons.js $(SRCJSDIR)/propsbase.js \
	   $(SRCJSDIR)/ll.js $(SRCJSDIR)/dates.js $(SRCJSDIR)/tabbase.js $(SRCJSDIR)/resbase.js $(SRCJSDIR)/invoice.js
$(SRCJSDIR)/cm/pginvoice.js: $(PGINV)
	cat $^ > temp.uncompressed
	jszip temp.uncompressed $@
	rm temp.uncompressed
PGSETTINGS= src/js/cm/j.js $(SRCJSDIR)/commons.js $(SRCJSDIR)/propsbase.js \
		    $(SRCJSDIR)/ll.js $(SRCJSDIR)/settings.js
src/js/cm/pgsettings.js: $(PGSETTINGS)
	cat $^ > temp.uncompressed
	jszip temp.uncompressed $@
	rm temp.uncompressed

$(SRCJSDIR)/cm/j.js: $(SRCJSDIR)/jquery/jquery.js $(SRCJSDIR)/jquery/jquery-ui.js \
			 $(SRCJSDIR)/jquery/jquery.hoverIntent.js $(SRCJSDIR)/jquery/jquery.humanmsg.js \
			 $(SRCJSDIR)/jquery/jquery.simplemodal-1.3.5.js $(SRCJSDIR)/jquery/jquery.contextMenu.js
	cat $^ > $@

jspages:
	make $(SRCJSDIR)/cm/j.js
	make $(SRCJSDIR)/cm/pgprops.js
	make $(SRCJSDIR)/cm/pgtab.js
	make $(SRCJSDIR)/cm/pgres.js
	make $(SRCJSDIR)/cm/pginit.js
	make $(SRCJSDIR)/cm/pgpricing.js
	make $(SRCJSDIR)/cm/pginvoice.js
	make $(SRCJSDIR)/cm/pgsettings.js
	make $(SRCJSDIR)/cm/pgsearch.js
	cp src/js/jquery/jquery.js src/js/

