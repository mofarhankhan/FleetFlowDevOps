import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Box, CheckCircle2,
  ChevronDown, CircleDollarSign, Clock3, LayoutDashboard, Menu, Package,
  Plus, RefreshCw, Search, ShieldCheck, Truck, X, MapPin, Warehouse
} from 'lucide-react'

const API = '/api'
const statuses = ['Pending', 'Processing', 'In Transit', 'Delivered', 'Cancelled']
const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0))
const dateFmt = d => d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      message = body.detail || message
    } catch {}
    throw new Error(message)
  }
  if (response.status === 204) return null
  return response.json()
}

function StatusPill({ status }) {
  const key = (status || 'pending').toLowerCase().replaceAll(' ', '-')
  return <span className={`status status-${key}`}><i />{status}</span>
}

function StatCard({ title, value, detail, icon: Icon, tone, trend }) {
  return <article className="stat-card">
    <div className="stat-top"><span>{title}</span><span className={`stat-icon ${tone}`}><Icon size={19}/></span></div>
    <div className="stat-value">{value}</div>
    <div className="stat-detail">{trend && <span className="trend"><ArrowUpRight size={14}/>{trend}</span>}{detail}</div>
  </article>
}

function Modal({ title, close, children }) {
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}>
    <section className="modal">
      <div className="modal-head"><div><p className="eyebrow">FLEETFLOW OPERATIONS</p><h2>{title}</h2></div><button className="icon-button" onClick={close} aria-label="Close"><X size={19}/></button></div>
      {children}
    </section>
  </div>
}

export default function App() {
  const [page, setPage] = useState('Overview')
  const [dashboard, setDashboard] = useState(null)
  const [shipments, setShipments] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [lowStock, setLowStock] = useState(false)
  const [modal, setModal] = useState('')
  const [tracking, setTracking] = useState('')
  const [trackingResult, setTrackingResult] = useState(null)

  async function loadAll() {
    setLoading(true); setError('')
    try {
      const [d, s, i] = await Promise.all([
        request('/dashboard'),
        request('/shipments'),
        request('/inventory'),
      ])
      setDashboard(d); setShipments(s); setInventory(i)
    } catch (e) { setError(e.message || 'Unable to connect to API.') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  const filteredShipments = useMemo(() => shipments.filter(s => {
    const q = search.toLowerCase()
    const matches = !q || [s.tracking_number, s.customer_name, s.origin, s.destination].some(v => (v || '').toLowerCase().includes(q))
    return matches && (!statusFilter || s.status === statusFilter)
  }), [shipments, search, statusFilter])

  const filteredInventory = useMemo(() => inventory.filter(i => {
    const q = search.toLowerCase()
    const matches = !q || [i.sku, i.name, i.category].some(v => (v || '').toLowerCase().includes(q))
    return matches && (!lowStock || i.quantity <= i.reorder_level)
  }), [inventory, search, lowStock])

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }

  async function createShipment(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form.entries())
    body.freight_cost = Number(body.freight_cost || 0)
    body.expected_delivery = body.expected_delivery || null
    try {
      await request('/shipments', { method: 'POST', body: JSON.stringify(body) })
      setModal(''); notify('Shipment created successfully.'); await loadAll()
    } catch (err) { notify(err.message) }
  }

  async function updateStatus(id, status) {
    try {
      await request(`/shipments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      notify('Shipment status updated.'); await loadAll()
    } catch (err) { notify(err.message) }
  }

  async function createInventory(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form.entries())
    body.quantity = Number(body.quantity || 0)
    body.reorder_level = Number(body.reorder_level || 0)
    body.unit_price = Number(body.unit_price || 0)
    try {
      await request('/inventory', { method: 'POST', body: JSON.stringify(body) })
      setModal(''); notify('Inventory item added.'); await loadAll()
    } catch (err) { notify(err.message) }
  }

  async function changeQuantity(item) {
    const value = window.prompt(`Enter new quantity for ${item.name}:`, String(item.quantity))
    if (value === null) return
    if (!/^\d+$/.test(value)) return notify('Quantity must be a whole number of 0 or more.')
    try {
      await request(`/inventory/${item.id}`, { method: 'PATCH', body: JSON.stringify({ quantity: Number(value) }) })
      notify('Inventory quantity updated.'); await loadAll()
    } catch (err) { notify(err.message) }
  }

  async function deleteInventory(item) {
    if (!window.confirm(`Delete ${item.name} (${item.sku})?`)) return
    try {
      await request(`/inventory/${item.id}`, { method: 'DELETE' })
      notify('Inventory item deleted.'); await loadAll()
    } catch (err) { notify(err.message) }
  }

  async function trackShipment(e) {
    e.preventDefault()
    try {
      setTrackingResult(await request(`/tracking/${encodeURIComponent(tracking.trim())}`))
    } catch (err) { setTrackingResult({ error: err.message }) }
  }

  const nav = [
    { name: 'Overview', icon: LayoutDashboard },
    { name: 'Shipments', icon: Truck },
    { name: 'Inventory', icon: Warehouse },
    { name: 'Track shipment', icon: MapPin },
  ]

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Truck size={22}/></div><div><strong>fleetflow</strong><small>LOGISTICS CLOUD</small></div></div>
      <div className="workspace-label">WORKSPACE <ChevronDown size={13}/></div>
      <div className="workspace"><div className="workspace-avatar">FF</div><div><b>Fleet Operations</b><small>Operations team</small></div><span className="online-dot"/></div>
      <p className="nav-label">OPERATIONS</p>
      <nav>{nav.map(({ name, icon: Icon }) => <button key={name} className={`nav-link ${page === name ? 'active' : ''}`} onClick={() => { setPage(name); setSearch('') }}><Icon size={18}/><span>{name}</span>{name === 'Inventory' && <span className="nav-count">{inventory.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="support-card"><div className="support-icon"><ShieldCheck size={17}/></div><b>Operations status</b><p>All systems operational</p><div className="support-line"><span/></div><small>API & database connected</small></div><div className="profile"><div className="profile-avatar">FO</div><div><b>Fleet Operator</b><small>Administrator demo</small></div><ChevronDown size={15}/></div></div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="breadcrumbs"><span>Workspace</span><ArrowRight size={13}/><b>{page}</b></div>
        <div className="top-actions"><span className="system-status"><span/> Live system</span><span className="top-divider"/><div className="date-label">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</div><button className="icon-button" onClick={loadAll} aria-label="Refresh"><RefreshCw size={17}/></button><div className="profile-avatar top-avatar">FO</div></div>
      </header>

      <div className="content">
        {error && <div className="error-banner"><Activity size={17}/><div><b>Could not load FleetFlow data</b><p>{error}. If this is a fresh start, wait a few seconds and refresh.</p></div><button onClick={loadAll}>Retry</button></div>}
        {page === 'Overview' && <>
          <div className="page-heading"><div><p className="eyebrow">MONDAY · OPERATIONS OVERVIEW</p><h1>Good morning, Operator <span>✦</span></h1><p className="subtitle">Here’s what’s happening across your logistics network today.</p></div><button className="button button-primary" onClick={() => setModal('shipment')}><Plus size={17}/> New shipment</button></div>
          <div className="section-heading"><div><h2>Network performance</h2><p>Your logistics operations at a glance</p></div><span className="period-pill"><Activity size={14}/> All-time overview</span></div>
          <div className="stats-grid">
            <StatCard title="Total shipments" value={dashboard?.total_shipments ?? '—'} detail="Across all statuses" icon={Package} tone="purple" trend={null}/>
            <StatCard title="In transit" value={dashboard?.in_transit ?? '—'} detail="Currently on the road" icon={Truck} tone="blue"/>
            <StatCard title="Delivered" value={dashboard?.delivered ?? '—'} detail="Successfully completed" icon={CheckCircle2} tone="green"/>
            <StatCard title="Freight value" value={money(dashboard?.freight_value)} detail="Non-cancelled shipments" icon={CircleDollarSign} tone="amber"/>
          </div>
          <div className="overview-grid">
            <section className="panel shipment-panel"><div className="panel-heading"><div><h2>Recent shipments</h2><p>Latest updates from your network</p></div><button className="text-button" onClick={() => setPage('Shipments')}>View all <ArrowRight size={15}/></button></div><ShipmentTable rows={(dashboard?.recent_shipments || []).slice(0, 5)} updateStatus={updateStatus} compact/></section>
            <section className="panel health-panel"><div className="panel-heading"><div><h2>Inventory health</h2><p>Stockroom overview</p></div><span className="round-icon"><Warehouse size={17}/></span></div><div className="inventory-score"><div><strong>{dashboard?.inventory_items ?? '—'}</strong><span>SKUs tracked</span></div><div className="score-divider"/><div><strong className={dashboard?.low_stock_items ? 'warning-text' : ''}>{dashboard?.low_stock_items ?? '—'}</strong><span>Need restocking</span></div></div><div className="stock-meter"><div className="meter-label"><span>Stock availability</span><b>{dashboard?.inventory_items ? Math.round(((dashboard.inventory_items - dashboard.low_stock_items) / dashboard.inventory_items) * 100) : 0}% healthy</b></div><div className="meter-track"><div style={{ width: `${dashboard?.inventory_items ? ((dashboard.inventory_items - dashboard.low_stock_items) / dashboard.inventory_items) * 100 : 0}%` }}/></div></div><div className="low-stock-list"><div className="mini-list-heading">RESTOCK ATTENTION <span>{inventory.filter(i => i.quantity <= i.reorder_level).length} items</span></div>{inventory.filter(i => i.quantity <= i.reorder_level).slice(0, 3).map(item => <div className="low-stock-item" key={item.id}><div className="product-icon"><Box size={16}/></div><div className="product-details"><b>{item.name}</b><small>{item.sku}</small></div><div className="stock-qty"><b>{item.quantity}</b><small>left</small></div></div>)}{inventory.every(i => i.quantity > i.reorder_level) && <p className="empty-note">All inventory is above its reorder threshold.</p>}</div><button className="button button-secondary full-button" onClick={() => setPage('Inventory')}>Manage inventory <ArrowRight size={15}/></button></section>
          </div>
          <div className="bottom-note"><div className="note-icon"><ShieldCheck size={17}/></div><div><b>Your operations are in sync</b><p>FleetFlow is connected to your application API and PostgreSQL data layer.</p></div><span className="note-status">● Healthy</span></div>
        </>}

        {page === 'Shipments' && <><div className="page-heading"><div><p className="eyebrow">LOGISTICS MANAGEMENT</p><h1>Shipments</h1><p className="subtitle">Create, search, and update deliveries across your network.</p></div><button className="button button-primary" onClick={() => setModal('shipment')}><Plus size={17}/> New shipment</button></div><div className="stats-grid compact-stats"><StatCard title="All shipments" value={shipments.length} detail="Total records" icon={Package} tone="purple"/><StatCard title="In transit" value={shipments.filter(s => s.status === 'In Transit').length} detail="Moving through network" icon={Truck} tone="blue"/><StatCard title="Awaiting dispatch" value={shipments.filter(s => ['Pending','Processing'].includes(s.status)).length} detail="Need operational action" icon={Clock3} tone="amber"/><StatCard title="Delivered" value={shipments.filter(s => s.status === 'Delivered').length} detail="Completed deliveries" icon={CheckCircle2} tone="green"/></div><section className="panel data-panel"><div className="panel-heading"><div><h2>Shipment register</h2><p>{filteredShipments.length} records match your filters</p></div><div className="filter-row"><div className="search-box"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shipment..." /></div><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select></div></div><ShipmentTable rows={filteredShipments} updateStatus={updateStatus}/></section></>}

        {page === 'Inventory' && <><div className="page-heading"><div><p className="eyebrow">WAREHOUSE MANAGEMENT</p><h1>Inventory</h1><p className="subtitle">Monitor stock levels, reorder thresholds, and product value.</p></div><button className="button button-primary" onClick={() => setModal('inventory')}><Plus size={17}/> Add item</button></div><div className="stats-grid compact-stats"><StatCard title="Total SKUs" value={inventory.length} detail="Unique inventory items" icon={Box} tone="purple"/><StatCard title="Units in stock" value={inventory.reduce((a, i) => a + i.quantity, 0).toLocaleString('en-IN')} detail="Across all SKUs" icon={Warehouse} tone="blue"/><StatCard title="Low stock items" value={inventory.filter(i => i.quantity <= i.reorder_level).length} detail="At or below reorder level" icon={ArrowDownRight} tone="amber"/><StatCard title="Stock value" value={money(inventory.reduce((a, i) => a + i.quantity * i.unit_price, 0))} detail="Estimated inventory value" icon={CircleDollarSign} tone="green"/></div><section className="panel data-panel"><div className="panel-heading"><div><h2>Stock register</h2><p>Manage your warehouse inventory</p></div><div className="filter-row"><div className="search-box"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SKU or product..." /></div><label className="checkbox-filter"><input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)}/> Low stock only</label></div></div><div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>ON HAND</th><th>REORDER AT</th><th>UNIT PRICE</th><th>STOCK STATUS</th><th>ACTIONS</th></tr></thead><tbody>{filteredInventory.map(i => <tr key={i.id}><td><div className="shipment-cell"><div className="table-icon inventory"><Box size={17}/></div><div><b>{i.name}</b><small>{i.sku}</small></div></div></td><td>{i.category}</td><td><b>{i.quantity}</b> units</td><td>{i.reorder_level} units</td><td>{money(i.unit_price)}</td><td>{i.quantity <= i.reorder_level ? <span className="stock-badge low">Low stock</span> : <span className="stock-badge good">In stock</span>}</td><td><div className="action-buttons"><button className="small-action" onClick={() => changeQuantity(i)}>Edit qty</button><button className="small-action danger-action" onClick={() => deleteInventory(i)} title="Delete item"><X size={14}/></button></div></td></tr>)}{!filteredInventory.length && <tr><td colSpan="7"><EmptyState title="No inventory found" text="Try another search or add an inventory item."/></td></tr>}</tbody></table></div></section></>}

        {page === 'Track shipment' && <><div className="page-heading"><div><p className="eyebrow">CUSTOMER EXPERIENCE</p><h1>Track a shipment</h1><p className="subtitle">Look up a delivery using its unique tracking number.</p></div></div><section className="panel tracking-panel"><div className="tracking-hero"><div className="tracking-symbol"><MapPin size={25}/></div><h2>Where is your shipment?</h2><p>Enter a FleetFlow tracking number to see the latest delivery status.</p><form className="tracking-form" onSubmit={trackShipment}><div className="search-box tracking-input"><Search size={18}/><input required value={tracking} onChange={e => setTracking(e.target.value)} placeholder="e.g. FF-10001"/></div><button className="button button-primary">Track shipment <ArrowRight size={16}/></button></form><div className="demo-hint">Try demo tracking IDs: <button onClick={() => setTracking('FF-10001')}>FF-10001</button><button onClick={() => setTracking('FF-10002')}>FF-10002</button><button onClick={() => setTracking('FF-10003')}>FF-10003</button></div></div>{trackingResult && <div className="tracking-result">{trackingResult.error ? <div className="tracking-error"><X size={18}/>{trackingResult.error}</div> : <><div className="tracking-result-head"><div><p className="eyebrow">TRACKING NUMBER</p><h3>{trackingResult.tracking_number}</h3></div><StatusPill status={trackingResult.status}/></div><div className="route-visual"><div className="route-point"><span className="route-dot start"/><small>ORIGIN</small><b>{trackingResult.origin}</b></div><div className="route-line"><Truck size={19}/></div><div className="route-point destination"><span className="route-dot end"/><small>DESTINATION</small><b>{trackingResult.destination}</b></div></div><div className="tracking-meta"><div><small>CUSTOMER</small><b>{trackingResult.customer_name}</b></div><div><small>SHIPMENT DATE</small><b>{dateFmt(trackingResult.shipment_date)}</b></div><div><small>EXPECTED DELIVERY</small><b>{dateFmt(trackingResult.expected_delivery)}</b></div></div></>}</div>}</section></>}

        {loading && <div className="loading-line"><RefreshCw size={15}/> Syncing operational data…</div>}
        <footer><span>© {new Date().getFullYear()} FleetFlow Logistics Cloud</span><span><span className="footer-dot"/> API connected · PostgreSQL</span><span>Built for better movement.</span></footer>
      </div>
    </main>

    {modal === 'shipment' && <Modal title="Create new shipment" close={() => setModal('')}><form className="form-grid" onSubmit={createShipment}><label className="span-2">Customer name<input name="customer_name" required minLength="2" placeholder="e.g. Acme Retail Pvt. Ltd."/></label><label>Origin<input name="origin" required minLength="2" placeholder="City, Country"/></label><label>Destination<input name="destination" required minLength="2" placeholder="City, Country"/></label><label>Shipment date<input name="shipment_date" type="date" defaultValue={new Date().toISOString().slice(0,10)} required/></label><label>Expected delivery<input name="expected_delivery" type="date"/></label><label>Freight cost (INR)<input name="freight_cost" type="number" min="0" step="0.01" defaultValue="0" required/></label><label>Initial status<select name="status" defaultValue="Pending">{statuses.map(s => <option key={s}>{s}</option>)}</select></label><label className="span-2">Notes (optional)<textarea name="notes" rows="2" placeholder="Handling instructions, delivery notes..."/></label><div className="form-actions span-2"><button type="button" className="button button-secondary" onClick={() => setModal('')}>Cancel</button><button className="button button-primary"><Plus size={16}/> Create shipment</button></div></form></Modal>}

    {modal === 'inventory' && <Modal title="Add inventory item" close={() => setModal('')}><form className="form-grid" onSubmit={createInventory}><label>SKU<input name="sku" required minLength="2" placeholder="e.g. PACK-100"/></label><label>Product name<input name="name" required minLength="2" placeholder="Product name"/></label><label>Category<input name="category" required defaultValue="General" placeholder="Packaging"/></label><label>Quantity on hand<input name="quantity" type="number" min="0" defaultValue="0" required/></label><label>Reorder level<input name="reorder_level" type="number" min="0" defaultValue="10" required/></label><label>Unit price (INR)<input name="unit_price" type="number" min="0" step="0.01" defaultValue="0" required/></label><div className="form-actions span-2"><button type="button" className="button button-secondary" onClick={() => setModal('')}>Cancel</button><button className="button button-primary"><Plus size={16}/> Add inventory</button></div></form></Modal>}

    {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>
}

function ShipmentTable({ rows, updateStatus, compact = false }) {
  return <div className="table-wrap"><table><thead><tr><th>SHIPMENT</th><th>ROUTE</th><th>SHIP DATE</th><th>STATUS</th><th>FREIGHT</th>{!compact && <th>UPDATE STATUS</th>}</tr></thead><tbody>{rows.map(s => <tr key={s.id}><td><div className="shipment-cell"><div className="table-icon"><Truck size={17}/></div><div><b>{s.tracking_number}</b><small>{s.customer_name}</small></div></div></td><td><div className="route-cell"><span>{s.origin}</span><ArrowRight size={13}/><span>{s.destination}</span></div></td><td>{dateFmt(s.shipment_date)}</td><td><StatusPill status={s.status}/></td><td className="money-cell">{money(s.freight_cost)}</td>{!compact && <td><select className="status-select" value={s.status} onChange={e => updateStatus(s.id, e.target.value)} aria-label={`Update status for ${s.tracking_number}`}>{statuses.map(st => <option key={st}>{st}</option>)}</select></td>}</tr>)}{!rows.length && <tr><td colSpan={compact ? 5 : 6}><EmptyState title="No shipments found" text="Create a shipment or change your filters."/></td></tr>}</tbody></table></div>
}

function EmptyState({ title, text }) {
  return <div className="empty-state"><div className="empty-icon"><Package size={20}/></div><b>{title}</b><p>{text}</p></div>
}
