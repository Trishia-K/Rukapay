import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const STEPS = { SEARCH: 'search', PIN: 'pin', DONE: 'done' };

export default function Kiosk() {
  const [now, setNow] = useState(new Date());
  const [step, setStep] = useState(STEPS.SEARCH);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [person, setPerson] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [resultLabel, setResultLabel] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setMatches([]);
      return;
    }
    const t = setTimeout(() => {
      api.get(`/people?search=${encodeURIComponent(query)}`).then(setMatches).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const pickPerson = (p) => {
    setPerson(p);
    setError('');
    if (p.pin) {
      setStep(STEPS.PIN);
    } else {
      signIn(p.id);
    }
  };

  const checkPin = async () => {
    try {
      const ok = await api.post('/people/verify-pin', { personId: person.id, pin });
      if (ok) {
        signIn(person.id);
      } else {
        setError('That PIN doesn\u2019t match. Try again.');
      }
    } catch {
      setError('Something went wrong checking that PIN.');
    }
  };

  const signIn = async (personId) => {
    const log = await api.post('/attendance/sign', { personId });
    setResultLabel(log.timeOut ? 'Signed out' : 'Signed in');
    setStep(STEPS.DONE);
    setTimeout(reset, 2800);
  };

  const reset = () => {
    setStep(STEPS.SEARCH);
    setQuery('');
    setMatches([]);
    setPerson(null);
    setPin('');
    setError('');
  };

  return (
    <div className="kiosk-shell">
      <div className="kiosk-card">
        <div className="kiosk-clock">{now.toLocaleDateString()} · {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <div className="kiosk-title">RukaTrack Sign-In</div>

        {step === STEPS.SEARCH && (
          <>
            <input
              autoFocus
              className="field-input"
              placeholder="Start typing your name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div style={{ textAlign: 'left' }}>
              {matches.map((p) => (
                <div
                  key={p.id}
                  onClick={() => pickPerson(p)}
                  style={{ padding: '12px 14px', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--gray-200)', marginBottom: 8 }}
                >
                  <strong>{p.fullName}</strong>
                  {p.department && <span style={{ color: 'var(--gray-500)' }}> · {p.department}</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {step === STEPS.PIN && (
          <>
            <p style={{ color: 'var(--gray-500)', marginTop: -12 }}>Hi {person.fullName.split(' ')[0]}, enter your PIN</p>
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="field-input"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
            />
            {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
            <button className="btn btn-primary" onClick={checkPin} disabled={pin.length < 4}>Continue</button>
          </>
        )}

        {step === STEPS.DONE && (
          <>
            <div style={{ fontSize: 44, marginBottom: 8 }}>✓</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy-900)' }}>
              {resultLabel}, {person.fullName.split(' ')[0]}
            </p>
            <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Have a great day</p>
          </>
        )}
      </div>

      <Link to="/" style={{ position: 'absolute', bottom: 16, right: 20, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
        Exit kiosk mode
      </Link>
    </div>
  );
}
