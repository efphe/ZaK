from __future__ import absolute_import
from __future__ import with_statement
import sys, os
sys.path= sys.path + [os.path.dirname(os.path.abspath(__file__))]
del os, sys

from twisted.application import service
application= service.Application('Zak')
from twisted.application import internet
from nevow import appserver
from server.pages import ZakAdmin as Toor
rootfarm= appserver.NevowSite(Toor())
del appserver
del Toor
del service

internet.TCPServer(11211, rootfarm, 1, '127.0.0.1').setServiceParent(application)
del internet
