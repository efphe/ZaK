gw:
	/usr/bin/twistd -noy gateway.py
pyclean:
	for i in `find . -name \*pyc`; do rm $$i; done

PGPROPS= src/js/j.js src/js/commons.js \
		 src/js/ll.js src/js/propsbase.js src/js/properties.js
src/js/cm/pgprops.js: $(PGPROPS)
	cat $^ > temp.uncompressed
	jszip temp.uncompressed $@
	rm temp.uncompressed

PGTAB= src/js/j.js src/js/commons.js src/js/propsbase.js \
	   src/js/ll.js src/js/dates.js src/js/tabbase.js src/js/tab.js
src/js/cm/pgtab.js: $(PGTAB)
	cat $^ > temp.uncompressed
	jszip temp.uncompressed $@
	rm temp.uncompressed

PGRES= src/js/j.js src/js/commons.js src/js/propsbase.js \
	   src/js/ll.js src/js/dates.js src/js/tabbase.js src/js/res.js
src/js/cm/pgres.js: $(PGRES)
	cat $^ > temp.uncompressed
	jszip temp.uncompressed $@
	rm temp.uncompressed

PGINIT= src/js/j.js src/js/commons.js src/js/init.js
src/js/cm/pginit.js: $(PGINIT)
	cat $^ > temp.uncompressed
	jszip temp.uncompressed $@
	rm temp.uncompressed

PGPRICES= src/js/j.js src/js/commons.js src/js/dates.js \
		 src/js/ll.js src/js/propsbase.js src/js/pricing.js
src/js/cm/pgpricing.js: $(PGPRICES)
	cat $^ > temp.uncompressed
	jszip temp.uncompressed $@
	rm temp.uncompressed

src/js/j.js: src/js/jquery/jquery.js src/js/jquery/jquery-ui.js \
			 src/js/jquery/jquery.hoverIntent.js src/js/jquery/jquery.humanmsg.js \
			 src/js/jquery/jquery.simplemodal-1.3.5.js src/js/jquery/jquery.contextMenu.js
	cat $^ > $@

jspages:
	make src/js/j.js
	make src/js/cm/pgprops.js
	make src/js/cm/pgtab.js
	make src/js/cm/pgres.js
	make src/js/cm/pginit.js
	make src/js/cm/pgpricing.js

