import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import CarCard from '../components/CarCard'
import InquiryModal from '../components/InquiryModal'

export default function Home() {
  const { session, isAdmin } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const [sel, setSel] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    supabase.from('cars').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setCars(data || []); setLoading(false)
      const id = loc.state?.carId
      if (id && session) setSel((data || []).find((c) => c.id === id) || null)
    })
  }, [session])

  function inquire(car) {
    if (!session) return nav('/login', { state: { carId: car.id, register: true } })
    if (isAdmin) return alert('Admins cannot send inquiries. Use a customer account.')
    setSel(car)
  }

  const cats = ['All', ...new Set(cars.map((c) => c.category))]
  const list = cars.filter((c) => (cat === 'All' || c.category === cat) && c.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <section className="hero">
        <h1>Hire a car you can trust, from Nairobi to the coast.</h1>
        <p>Browse our fleet, create a free account and send an inquiry. We confirm availability and pricing within hours.</p>
      </section>
      <div className="filters">
        <input placeholder="Search cars" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search cars" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      {loading ? <p className="empty">Loading cars...</p> : (
        <div className="grid">
          {list.map((c) => <CarCard key={c.id} car={c} onInquire={inquire} />)}
          {!list.length && <p className="empty">No cars found. Try a different search or category.</p>}
        </div>
      )}
      {sel && <InquiryModal car={sel} onClose={() => setSel(null)}
        onSent={() => { setSel(null); setToast('Inquiry sent. We will contact you soon.'); setTimeout(() => nav('/my-inquiries'), 1200) }} />}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
