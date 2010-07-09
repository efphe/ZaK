from nevow import rend, loaders, tags as T, inevow
from twisted.web.util import ChildRedirector
from twisted.web.static import File
from twisted.web import resource
import os
JsDispenser= File('src/js', defaultType= 'application/x-javascript')
CssDispenser= File('src/css', defaultType= 'text/css')
ImgDispenser= File('src/imgs', defaultType= 'image/png')

class IZak:
  def __init__(self):
    self.zakDbVersion= self.dbInit()
  def dbInit(self):
    files= [f for f in os.listdir('src/db') if f.endswith('.sql')]
    files.sort()
    self.files= files
    return len(files)
  def getSchema(self, fromversion= 0):
    res= ''
    for f in self.files[fromversion:]:
      res+= open('src/db/%s' % f).read()
    return res

ZaK= IZak()

class AdminTemplate(rend.Page):
  addSlash= 0
  docFactory= loaders.xmlfile('src/html/template.xhtml')
  jsorigin= None
  cssorigin= None
  xmlfile= None
  def render_contents(self, ctx, data):
    return loaders.xmlfile(self.xmlfile)
  def render_js(self, ctx, data):
    return self.jsorigin
  def render_css(self, ctx, data):
    if self.cssorigin:
      if isinstance(self.cssorigin, str):
        return T.link(type= 'text/css', rel= 'stylesheet', href= self.cssorigin)
      else:
        return [T.link(type= 'text/css', rel= 'stylesheet', href= s) for s in self.cssorigin]
    return ''

class AdminProperties(AdminTemplate):
  jsorigin= '/js/cm/pgprops.js'
  xmlfile= 'src/html/properties.xhtml'
  cssorigin= '/css/props.css'
class AdminTableau(AdminTemplate):
  jsorigin= '/js/cm/pgtab.js'
  xmlfile= 'src/html/tableau.xhtml'
  cssorigin= '/css/tab.css', '/css/ui-themes/blitzer/jquery-ui-1.8.2.custom.css'

class AdminPricing(AdminTemplate):
  jsorigin= '/js/cm/pgpricing.js'
  xmlfile= 'src/html/pricing.xhtml'
  cssorigin= '/css/pricing.css', '/css/ui-themes/blitzer/jquery-ui-1.8.2.custom.css'

class AdminReservation(AdminTemplate):
  jsorigin= '/js/cm/pgres.js'
  xmlfile= 'src/html/res.xhtml'
  cssorigin= '/css/tab.css', '/css/res.css'

class AdminInvoice(rend.Page):
  docFactory= loaders.xmlfile('src/html/property_invoice.xhtml')

class AdminSchema(resource.Resource):
  def render(self, rqst):
    rqst.setHeader('content-type', 'text/plain')
    try:
      fromversion= int(rqst.args['fromversion'][0])
      return ZaK.getSchema(fromversion)
    except Exception, ss: 
      print 'Error parsing schema: %s' % str(ss)
      return ''

class AdminInit(rend.Page):
  docFactory= loaders.xmlfile('src/html/init.xhtml')
  def __init__(self):
    rend.Page.__init__(self)
    self.children= {
        '': self,
        'schema': AdminSchema(),
        }
  def locateChild(self, ctx, segs):
    if segs[0] != 'version':
      return rend.Page.locateChild(self, ctx, segs)
    rqst= inevow.IRequest(ctx)
    rqst.setHeader('content-type', 'text/plain')
    return str(ZaK.zakDbVersion), ()


class ZakAdmin(rend.Page):
  def __init__(self):
    rend.Page.__init__(self)
    self.children= {
        'dashboard': AdminProperties(),
        'tableau': AdminTableau(),
        'book': AdminReservation(),
        'js': JsDispenser,
        'css': CssDispenser,
        'imgs': ImgDispenser,
        '': ChildRedirector('/init/'),
        'init': AdminInit(),
        'pricing': AdminPricing(),
        'invoice': AdminInvoice(),
        }
