#!/usr/bin/python
import os
import sys
_bdir= 'src/js/gt'
if not os.path.isdir(_bdir):
  os.mkdir(_bdir)

import simplejson as enc
import gettext
def _gettext_json(lang):
  tr = gettext.translation('zak', 'jslocale', [lang])
  return enc.dumps(tr._catalog, ensure_ascii = False)

def gettext_json():
  langs= os.listdir('jslocale')
  for l in langs:
    buf= _gettext_json(l)
    df= '%s/zak.mo.%s.json' % (_bdir,l)
    print 'Writing file: %s' % df
    open(df, 'w').write(buf)
    print 'Writing file: %s.js' % df
    j= open(df).read()
    open('%s.js' % df, 'w').write('_gtlang=\'%s\';_gtmessages=%s' % (l,j)) 
    os.system('gzip -c %s.js > %s.jsgz' % (df, df))

if __name__ == '__main__':
  print gettext_json()
