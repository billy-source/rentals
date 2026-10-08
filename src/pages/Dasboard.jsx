import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import CarForm from '../components/CarForm'
import { kes, fmtDate } from '../utils'

const TABS = ['inquiries', 'cars', 'customers', 'activity']

export default function Dashboard() {
  const { session } = useAuth()
  const [tab, setTab] = useState('inquiries')
  const [d, setD] = useState({ cars: [], inq: [], users: [], log: [] })
  const [form, setForm] = useState(null) // null | 'new' | car object
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const [c, i, u, l] = await Promise.all([
      supabase.from('cars').select('*').order('created_at', { ascending: false }),
      supabase.from('inquiries').select('*, cars(name), profiles(full_name, phone, email)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false }),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(100),
    ])
    setD({ cars: c.data || [], inq: i.data || [], users: u.data || [], log: l.data || [] })
  }, [])
  useEffect(() => { load() }, [load])

  const log = (message) => supabase.from('activity_log').insert({ actor_id: session.user.id, message })

  async function setStatus(inq, status) {
    const { error } = await supabase.from('inquiries').update({ status }).eq('id', inq.id)
    if (error) return setErr(error.message)
    if (status === 'approved') await supabase.from('cars').update({ available: false }).eq('id', inq.car_id)
    load()
  }
  async function toggle(c) {
    await supabase.from('cars').update({ available: !c.available }).eq('id', c.id)
    await log(`${c.name} marked ${c.available ? 'rented' : 'available'}`); load()
  }
  async function remove(c) {
    if (!confirm(`Remove ${c.name}? This also deletes its inquiries.`)) return
    if (c.images?.length)
      await supabase.storage.from('car-images').remove(c.images.map((u) => u.split('/car-images/')[1]))
    const { error } = await supabase.from('cars').delete().eq('id', c.id)
    if (error) return setErr(error.message)
    await log(`Removed car ${c.name}`); load()
  }

  const revenue = d.inq.filter((i) => i.status === 'approved').reduce((s, i) => s + Number(i.total), 0)
  const stats = [
    [d.cars.length, 'Cars posted'], [d.cars.filter((c) => c.available).length, 'Available now'],
    [d.users.length, 'Customers'], [d.inq.filter((i) => i.status === 'pending').length, 'Pending inquiries'],
    [kes(revenue), 'Approved value'],
  ]

  return (
    <>
      <h2>Admin dashboard</h2>
      <div className="stats">{stats.map(([v, l]) => <div className="stat" key={l}><b>{v}</b>{l}</div>)}</div>
      <div className="tabs">
        {TABS.map((t) => <button key={t} className={`btn ${t === tab ? 'on' : ''}`} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
      </div>
      {err && <div className="err">{err}</div>}

      {tab === 'inquiries' && (d.inq.length ? (
        <div className="wrap"><table>
          <thead><tr><th>Customer</th><th>Car</th><th>Dates</th><th>Estimate</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{d.inq.map((i) => (
            <tr key={i.id}>
              <td>{i.profiles?.full_name}<div className="spec">{i.profiles?.phone}<br />{i.profiles?.email}</div></td>
              <td>{i.cars?.name}<div className="spec">{i.pickup_location}</div>{i.message && <div className="spec">"{i.message}"</div>}</td>
              <td>{i.start_date} to {i.end_date}</td><td>{kes(i.total)}</td>
              <td><span className={`tag ${i.status === 'approved' ? 'ok' : i.status === 'pending' ? 'wa' : 'no'}`}>{i.status}</span></td>
              <td>{i.status === 'pending' && (<>
                <button className="btn sm" onClick={() => setStatus(i, 'approved')}>Approve</button>{' '}
                <button className="btn sm bad" onClick={() => setStatus(i, 'declined')}>Decline</button></>)}</td>
            </tr>))}</tbody>
        </table></div>
      ) : <p className="empty">No inquiries yet.</p>)}

      {tab === 'cars' && (<>
        {form ? (
          <CarForm car={form === 'new' ? null : form} onCancel={() => setForm(null)} onDone={() => { setForm(null); load() }} />
        ) : <button className="btn pri" style={{ marginBottom: 12 }} onClick={() => setForm('new')}>Add a car</button>}
        <div className="wrap"><table>
          <thead><tr><th>Photo</th><th>Car</th><th>Price/day</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{d.cars.map((c) => (
            <tr key={c.id}>
              <td>{c.images?.[0] ? <img className="mini" src={c.images[0]} alt="" /> : <span className="spec">None</span>}</td>
              <td>{c.name}<div className="spec">{c.category}</div></td><td>{kes(c.price_per_day)}</td>
              <td><span className={`tag ${c.available ? 'ok' : 'no'}`}>{c.available ? 'Available' : 'Rented'}</span></td>
              <td><button className="btn sm" onClick={() => { setForm(c); window.scrollTo(0, 0) }}>Edit</button>{' '}
                <button className="btn sm" onClick={() => toggle(c)}>Mark {c.available ? 'rented' : 'available'}</button>{' '}
                <button className="btn sm bad" onClick={() => remove(c)}>Remove</button></td>
            </tr>))}</tbody>
        </table></div>
      </>)}

      {tab === 'customers' && (d.users.length ? (
        <div className="wrap"><table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Inquiries</th><th>Joined</th></tr></thead>
          <tbody>{d.users.map((u) => (
            <tr key={u.id}><td>{u.full_name}</td><td>{u.email}</td><td>{u.phone}</td>
              <td>{d.inq.filter((i) => i.user_id === u.id).length}</td><td>{fmtDate(u.created_at)}</td></tr>))}</tbody>
        </table></div>
      ) : <p className="empty">No customers yet.</p>)}

      {tab === 'activity' && (d.log.length ? (
        <div className="wrap"><table>
          <thead><tr><th>Time</th><th>Activity</th></tr></thead>
          <tbody>{d.log.map((l) => <tr key={l.id}><td>{fmtDate(l.created_at)}</td><td>{l.message}</td></tr>)}</tbody>
        </table></div>
      ) : <p className="empty">No activity yet.</p>)}
    </>
  )
}
