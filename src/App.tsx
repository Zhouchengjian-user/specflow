import { Plus, Settings2, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import { toast } from 'sonner'
import { SettingsContext, ShellContext } from '@/components/common'
import { clearProductChats } from '@/components/chat/chat-storage'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { api, type ProductSummary, type Settings } from '@/lib/api'
import { productHref, useRoute, type Route } from '@/lib/route'
import { HomePage } from '@/pages/home'
import { NewProductPage } from '@/pages/new-product'
import { ProductPage } from '@/pages/product'
import { SettingsPage } from '@/pages/settings'

type ProductMenu = { product: ProductSummary; x: number; y: number }

function Sidebar({route,settings,products,onNavigate,onDelete}:{route:Route;settings:Settings|null;products:ProductSummary[]|null;onNavigate:()=>void;onDelete:(product:ProductSummary)=>Promise<void>}) {
 const [menu,setMenu]=useState<ProductMenu|null>(null)
 useEffect(()=>{
  const close=()=>setMenu(null)
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape')close()}
  window.addEventListener('click',close)
  window.addEventListener('resize',close)
  window.addEventListener('scroll',close,true)
  window.addEventListener('keydown',key)
  return()=>{window.removeEventListener('click',close);window.removeEventListener('resize',close);window.removeEventListener('scroll',close,true);window.removeEventListener('keydown',key)}
 },[])
 const openMenu=(event:MouseEvent,product:ProductSummary)=>{
  event.preventDefault();event.stopPropagation()
  setMenu({product,x:Math.min(event.clientX,window.innerWidth-174),y:Math.min(event.clientY,window.innerHeight-54)})
 }
 return <div className="sidebar-inner">
  <div className="sidebar-brand-row"><a className="sidebar-brand" href="#/products" onClick={onNavigate} aria-label="SpecFlow 产品首页"><img src="/specflow-icon.png" alt="" width="28" height="28"/><span>SpecFlow</span></a><button className="mobile-close" onClick={onNavigate} aria-label="关闭菜单"><X size={18}/></button></div>
  <a href="#/new" className={`sidebar-new nav-item ${route.page==='new'?'is-active':''}`} onClick={onNavigate}><Plus size={17}/><span>新建产品</span></a>
  <nav className="sidebar-products" aria-label="我的产品"><a className="sidebar-section" href="#/products" onClick={onNavigate}>我的产品</a>{products?.length===0&&<p className="empty-sidebar">还没有产品</p>}{products?.map(p=><a key={p.slug} className={`nav-item ${route.page==='product'&&route.slug===p.slug?'is-active':''}`} href={productHref(p.slug)} onClick={onNavigate} onContextMenu={event=>openMenu(event,p)} title={`${p.name}（右键可删除）`}><span className="product-name">{p.name}</span>{p.has_plan&&p.unknowns>0&&<span className="nav-count" title={`${p.unknowns} 个待确认问题`}>{p.unknowns}</span>}</a>)}</nav>
  {menu&&<div className="product-context-menu" role="menu" aria-label={`${menu.product.name} 操作`} style={{left:menu.x,top:menu.y}} onClick={event=>event.stopPropagation()}><button role="menuitem" onClick={()=>{const product=menu.product;setMenu(null);void onDelete(product)}}><Trash2 size={15}/><span>删除项目</span></button></div>}
  <div className="sidebar-settings"><a href="#/settings" onClick={onNavigate} className={`nav-item ${route.page==='settings'?'is-active':''}`}><Settings2 size={17}/><span><span>模型设置</span><small>{settings?.mock?'前端演示 · 未调用模型':settings?.configured?settings.model:'未配置模型'}</small></span></a></div>
 </div>
}
export default function App(){
 const route=useRoute();const [settings,setSettings]=useState<Settings|null>(null);const [products,setProducts]=useState<ProductSummary[]|null>(null);const [error,setError]=useState('');const [sidebarOpen,setSidebarOpen]=useState(false)
 const reload=useCallback(async()=>{try{setSettings(await api.settings());setError('')}catch(e){setError((e as Error).message)}},[])
 const reloadProducts=useCallback(async()=>{try{setProducts((await api.products()).products)}catch(e){setError((e as Error).message)}},[])
 const deleteProduct=useCallback(async(product:ProductSummary)=>{
  if(!window.confirm(`确定删除「${product.name}」吗？\n\n该项目的方案、版本记录和对话都会被删除，且无法恢复。`))return
  try{
   await api.deleteProduct(product.slug)
   clearProductChats(product.slug)
   if(route.page==='product'&&route.slug===product.slug)location.hash='#/products'
   await reloadProducts()
   toast.success(`已删除「${product.name}」`)
  }catch(e){toast.error((e as Error).message||'删除失败，请稍后再试')}
 },[reloadProducts,route])
 useEffect(()=>{reload()},[reload]);const routeKey=location.hash
 useEffect(()=>{reloadProducts()},[reloadProducts,routeKey])
 useEffect(()=>{if(products?.length&&(!location.hash||location.hash==='#/'))location.replace(productHref(products[0].slug))},[products,routeKey])
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();location.hash='#/new'}if(e.key==='Escape')setSidebarOpen(false)};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[])
 return <TooltipProvider><ShellContext.Provider value={{products,reloadProducts,openSidebar:()=>setSidebarOpen(true)}}><div className="studio-shell"><aside className={`studio-sidebar ${sidebarOpen?'is-open':''}`}><Sidebar route={route} settings={settings} products={products} onNavigate={()=>setSidebarOpen(false)} onDelete={deleteProduct}/></aside>{sidebarOpen&&<button className="sidebar-scrim" aria-label="关闭菜单遮罩" onClick={()=>setSidebarOpen(false)}/>} 
 <main className="studio-main">{error&&<div className="connection-error"><h2>暂时无法连接引擎</h2><p>{error}</p><button onClick={()=>{reload();reloadProducts()}}>重新连接</button></div>}{settings&&<SettingsContext.Provider value={{settings,reload}}>{route.page==='home'?<HomePage/>:route.page==='new'?<NewProductPage/>:route.page==='settings'?<SettingsPage/>:<ProductPage slug={route.slug} tab={route.tab}/>}</SettingsContext.Provider>}</main></div></ShellContext.Provider><Toaster position="bottom-center"/></TooltipProvider>
}
