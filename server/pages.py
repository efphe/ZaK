from nevow import rend, loaders, tags as T, inevow
from twisted.web.util import ChildRedirector
from twisted.web.static import File
from twisted.python.util import sibpath
import os
_bdir= sibpath(os.path.dirname(__file__), '')
_sdir= _bdir + 'src/'
JsDispenser= File(_sdir + 'js', defaultType= 'application/x-javascript')
CssDispenser= File(_sdir + 'css', defaultType= 'text/css')
ImgDispenser= File(_sdir + 'imgs', defaultType= 'image/png')

class IZak:
  def __init__(self):
    self.zakDbVersion= self.dbInit()
  def dbInit(self):
    files= [f for f in os.listdir(_sdir + 'db') if f.endswith('.sql')]
    files.sort()
    self.files= files
    return len(files)
  def getSchema(self, fromversion= 0):
    res= ''
    for f in self.files[fromversion:]:
      res+= open(_sdir + 'db/%s' % f).read()
    return res

ZaK= IZak()

class AdminTemplate(rend.Page):
  addSlash= 0
  docFactory= loaders.xmlfile(_sdir + 'html/template.xhtml')
  jsorigin= None
  cssorigin= None
  xmlfile= None
  def render_contents(self, ctx, data):
    return loaders.xmlfile(_bdir + self.xmlfile)
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

class AdminSettings(AdminTemplate):
  jsorigin= '/js/cm/pgsettings.js'
  xmlfile= 'src/html/settings.xhtml'
  cssorigin= '/css/pricing.css'

class AdminReservation(AdminTemplate):
  jsorigin= '/js/cm/pgres.js'
  xmlfile= 'src/html/res.xhtml'
  cssorigin= '/css/res.css', '/css/ui-themes/blitzer/jquery-ui-1.8.2.custom.css'

class AdminSearch(AdminTemplate):
  jsorigin= '/js/cm/pgsearch.js'
  xmlfile= 'src/html/search.xhtml'
  cssorigin= '/css/search.css'

class AdminInvoice(rend.Page):
  docFactory= loaders.xmlfile(_bdir + 'src/html/property_invoice.xhtml')
class ShowInvoice(rend.Page):
  docFactory= loaders.xmlfile(_bdir + 'src/html/property_oinvoice.xhtml')

class AdminInit(rend.Page):
  docFactory= None
  def locateChild(self, ctx, segs):
    rqst= inevow.IRequest(ctx)
    if segs[0] == 'version':
      rqst.setHeader('content-type', 'text/plain')
      return str(ZaK.zakDbVersion), ()
    if segs[0] == 'schema':
      fromversion= int(rqst.args['fromversion'][0])
      return ZaK.getSchema(fromversion), ()
    return '?', ()

class AdminNotSupported(rend.Page):
  docFactory= loaders.xmlfile(_bdir + 'src/html/bad_browser.xhtml')

class ZakAdmin(rend.Page):
  docFactory= loaders.xmlstr("""<html> 
  <head> 
    <script src="/js/cm/pginit.js"></script> 
  </head> 
  <body> 
    Welcome there.<br /> 
    Now initializing Zak <span id="dots"></span> 
  </body> 
</html>""")

  def __init__(self):
    rend.Page.__init__(self)
    self.children= {
        'dashboard': AdminProperties(),
        'tableau': AdminTableau(),
        'book': AdminReservation(),
        'js': JsDispenser,
        'css': CssDispenser,
        'imgs': ImgDispenser,
        'init': AdminInit(),
        'pricing': AdminPricing(),
        'oinvoice': ShowInvoice(),
        'invoice': AdminInvoice(),
        'settings': AdminSettings(),
        'notsupported': AdminNotSupported(),
        'search': AdminSearch(),
        '': self,
        }
