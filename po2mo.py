#!/usr/bin/python
import polib
import os
import sys

def po2mo(f):
  print 'Converting file ' + f
  po= polib.pofile(f)
  base= os.path.basename(f)
  df= os.path.dirname(f) + '/' + base.replace('.po', '.mo')
  po.save_as_mofile(df)
  print 'Converted file: ' + df

if __name__ == '__main__':
  po2mo(sys.argv[1])
