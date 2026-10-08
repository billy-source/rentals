import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { kes } from '../utils'

export default function MyInquiries() {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    supabase.from('inquiries').select('*, cars(name)').order('created_at', { ascending: false })
      .then(({ data }) => setRows(data || []))
  }, [])

  if (!rows) return <p className="empty">Loading...</p>
  return (
    <>
      <h2>My inquiries</h2>
      <p className="spec">Track the status of each request here.</p>
      {rows.length ? (
        <div className="wrap"><table>
          <thead><tr><th>Car</th><th>Dates</th><th>Pick-up</th><th>Estimate</th><th>Status</th></tr></thead>
          <tbody>{rows.map((i) => (
            <tr key={i.id}><td>{i.cars?.name}</td><td>{i.start_date} to {i.end_date}</td>
              <td>{i.pickup_location}</td><td>{kes(i.total)}</td>
              <td><span className={`tag ${i.status === 'approved' ? 'ok' : i.status === 'pending' ? 'wa' : 'no'}`}>{i.status}</span></td></tr>
          ))}</tbody>
        </table></div>
      ) : <p className="empty">No inquiries yet. Pick a car and send your first one.</p>}
    </>
  )
}
