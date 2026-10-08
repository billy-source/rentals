import { useState } from 'react'
import { kes } from '../utils'

export default function CarCard({ car, onInquire }) {
  const [i, setI] = useState(0)
  const imgs = car.images || []
  return (
    <article className="car">
      {imgs.length ? (
        <>
          <img className="photo" src={imgs[i]} alt={car.name} loading="lazy" />
          {imgs.length > 1 && (
            <div className="thumbs">
              {imgs.map((u, n) => (
                <img key={u} src={u} alt="" className={n === i ? 'sel' : ''} onClick={() => setI(n)} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="photo none">No photo yet</div>
      )}
      <div className="cb">
        <div className="between">
          <h3>{car.name}</h3>
          <span className={`tag ${car.available ? 'ok' : 'no'}`}>{car.available ? 'Available' : 'Rented'}</span>
        </div>
        <div className="spec">{car.category}: {car.seats} seats, {car.transmission}, {car.fuel}</div>
        {car.description && <p className="spec">{car.description}</p>}
        <div className="price">{kes(car.price_per_day)} <span className="spec">per day</span></div>
        <button className="btn pri" disabled={!car.available} onClick={() => onInquire(car)}>
          {car.available ? 'Inquire about this car' : 'Currently unavailable'}
        </button>
      </div>
    </article>
  )
}
