import polib
f= polib.pofile(file)
po.save_as_mofile('test.mo')

import os

def po2mo(f):
  po= polib.pofile(f)
  base= os.path.basename(f)
  polib.save_as_mofile(os.path.dirname(f) + '/' + base.replace('.po', '.mo'))
