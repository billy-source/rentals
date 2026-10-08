import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const loc = useLocation()
  const nav = useNavigate()
  const [reg, setReg] = useState(!!loc.state?.register)
  const [f, setF] = useState({ name: '', phone: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr(''); setInfo('')
    if (reg) {
      const { data, error } = await signUp(f.email, f.password, f.name.trim(), f.phone.trim())
      if (error) setErr(error.message)
      else if (!data.session) setInfo('Account created. Check your email to confirm it, then sign in.')
      else nav('/', { state: { carId: loc.state?.carId } })
    } else {
      const { error } = await signIn(f.email, f.password)
      if (error) setErr('Email or password is incorrect.')
      else nav('/', { state: { carId: loc.state?.carId } })
    }
    setBusy(false)
  }

  return (
    <form className="panel narrow" onSubmit={submit}>
      <h2>{reg ? 'Create your account' : 'Sign in'}</h2>
      {loc.state?.carId && <p className="spec">Sign in to send your inquiry for this car.</p>}
      {reg && (<>
        <label>Full name</label><input required value={f.name} onChange={set('name')} autoComplete="name" />
        <label>Phone</label><input required type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" />
      </>)}
      <label>Email</label><input required type="email" value={f.email} onChange={set('email')} autoComplete="email" />
      <label>Password</label>
      <input required type="password" minLength={6} value={f.password} onChange={set('password')}
        autoComplete={reg ? 'new-password' : 'current-password'} />
      <div className="err">{err}</div>
      {info && <div className="okmsg">{info}</div>}
      <button className="btn pri full" disabled={busy}>{busy ? 'Please wait...' : reg ? 'Create account' : 'Sign in'}</button>
      <p className="spec center">
        {reg ? 'Have an account?' : 'New here?'}{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); setReg(!reg) }}>{reg ? 'Sign in' : 'Create an account'}</a>
      </p>
    </form>
  )
}
