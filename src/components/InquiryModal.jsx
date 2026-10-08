import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { kes, daysBetween } from '../utils'

export default function InquiryModal({ car, onClose, onSent }) {
  const { session } = useAuth()
  const today = new Date().toISOString().slice(0, 10)
  const [f, setF] = useState({ start: '', end: '', loc: '', msg: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const days = daysBetween(f.start, f.end)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    if (days < 1) return setErr('Return date must be after the pick-up date.')
    setBusy(true); setErr('')
    const { error } = await supabase.from('inquiries').insert({
      car_id: car.id, user_id: session.user.id, start_date: f.start, end_date: f.end,
      pickup_location: f.loc.trim(), message: f.msg.trim(), total: days * car.price_per_day,
    })
    setBusy(false)
    if (error) return setErr(error.message)
    onSent()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Inquire: {car.name}</h2>
        <p className="spec">{kes(car.price_per_day)} per day</p>
        <div className="row">
          <div><label>Pick-up date</label><input type="date" min={today} required value={f.start} onChange={set('start')} /></div>
          <div><label>Return date</label><input type="date" min={f.start || today} required value={f.end} onChange={set('end')} /></div>
        </div>
        <label>Pick-up location</label>
        <input required placeholder="e.g. JKIA or Westlands" value={f.loc} onChange={set('loc')} />
        <label>Message (optional)</label>
        <textarea rows="3" value={f.msg} onChange={set('msg')} />
        {days > 0 && <div className="price">{days} day{days > 1 ? 's' : ''} = {kes(days * car.price_per_day)}</div>}
        <div className="err">{err}</div>
        <div className="row">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={busy}>{busy ? 'Sending...' : 'Send inquiry'}</button>
        </div>
      </form>
    </div>
  )
}
