import { useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'

const MAX_MB = 5

export default function CarForm({ car, onDone, onCancel }) {
  const { session } = useAuth()
  const [f, setF] = useState({
    name: car?.name || '', category: car?.category || '', price_per_day: car?.price_per_day || '',
    seats: car?.seats || 5, transmission: car?.transmission || 'Auto', fuel: car?.fuel || 'Petrol',
    description: car?.description || '',
  })
  const [existing, setExisting] = useState(car?.images || [])
  const [files, setFiles] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const previews = useMemo(() => files.map((x) => URL.createObjectURL(x)), [files])

  function pick(e) {
    const chosen = [...e.target.files]
    const bad = chosen.find((x) => !x.type.startsWith('image/') || x.size > MAX_MB * 1048576)
    if (bad) return setErr(`"${bad.name}" must be an image under ${MAX_MB} MB.`)
    setErr(''); setFiles([...files, ...chosen]); e.target.value = ''
  }

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const row = { ...f, price_per_day: Number(f.price_per_day), seats: Number(f.seats) }
      let id = car?.id
      if (id) {
        const { error } = await supabase.from('cars').update(row).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('cars').insert({ ...row, images: [] }).select().single()
        if (error) throw error
        id = data.id
      }

      const uploaded = []
      for (const file of files) {
        const path = `${id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
        const { error } = await supabase.storage.from('car-images').upload(path, file, { cacheControl: '3600' })
        if (error) throw error
        uploaded.push(supabase.storage.from('car-images').getPublicUrl(path).data.publicUrl)
      }

      const removed = (car?.images || []).filter((u) => !existing.includes(u))
      if (removed.length)
        await supabase.storage.from('car-images').remove(removed.map((u) => u.split('/car-images/')[1]))

      const { error } = await supabase.from('cars').update({ images: [...existing, ...uploaded] }).eq('id', id)
      if (error) throw error

      await supabase.from('activity_log').insert({
        actor_id: session.user.id, message: `${car ? 'Updated' : 'Added'} car ${f.name}`,
      })
      onDone()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h3>{car ? `Edit ${car.name}` : 'Add a new car'}</h3>
      <div className="row wrapRow">
        <div><label>Car name</label><input required value={f.name} onChange={set('name')} placeholder="Toyota RAV4" /></div>
        <div><label>Category</label><input required value={f.category} onChange={set('category')} placeholder="SUV" /></div>
        <div><label>Price per day (KES)</label><input required type="number" min="1" value={f.price_per_day} onChange={set('price_per_day')} /></div>
      </div>
      <div className="row wrapRow">
        <div><label>Seats</label><input type="number" min="1" value={f.seats} onChange={set('seats')} /></div>
        <div><label>Transmission</label>
          <select value={f.transmission} onChange={set('transmission')}><option>Auto</option><option>Manual</option></select></div>
        <div><label>Fuel</label>
          <select value={f.fuel} onChange={set('fuel')}><option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option></select></div>
      </div>
      <label>Description</label>
      <textarea rows="2" value={f.description} onChange={set('description')} />

      <label>Photos (JPG or PNG, up to {MAX_MB} MB each)</label>
      <input type="file" accept="image/*" multiple onChange={pick} />
      <div className="previews">
        {existing.map((u) => (
          <div key={u} className="pv"><img src={u} alt="" />
            <button type="button" onClick={() => setExisting(existing.filter((x) => x !== u))}>Remove</button></div>
        ))}
        {previews.map((u, n) => (
          <div key={u} className="pv"><img src={u} alt="" />
            <button type="button" onClick={() => setFiles(files.filter((_, i) => i !== n))}>Remove</button></div>
        ))}
      </div>

      <div className="err">{err}</div>
      <div className="row">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn pri" disabled={busy}>{busy ? 'Saving...' : car ? 'Save changes' : 'Add car'}</button>
      </div>
    </form>
  )
}
