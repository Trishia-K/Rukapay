import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { base64urlToBuffer, bufferToBase64url } from '../lib/webauthn';

const STEPS = { SEARCH: 'search', SCANNING: 'scanning', DONE: 'done', ERROR: 'error' };

export default function SignIn() {
  const [now, setNow] = useState(new Date());
  const [step, setStep] = useState(STEPS.SEARCH);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [person, setPerson] = useState(null);
  const [resultLabel, setResultLabel] = useState('');
  const [error, setError] = useState('');

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

  const pick = async (p) => {
    setPerson(p);
    setStep(STEPS.SCANNING);
    setError('');
    try {
      const options = await api.post(`/fingerprint/${p.id}/sign-in-options`, {});
      console.log(JSON.stringify(options.allowCredentials, null, 2));

      const publicKey = {
        challenge: base64urlToBuffer(options.challenge),
        timeout: options.timeout,
        rpId: options.rpId,
        userVerification: options.userVerification,
        allowCredentials: [],
      };

      console.log("Calling get()");
const credential = await navigator.credentials.get({ publicKey });
console.log("Returned from get()", credential);

      const assertion = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        clientExtensionResults: credential.getClientExtensionResults ? credential.getClientExtensionResults() : {},
        response: {
          clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
          authenticatorData: bufferToBase64url(credential.response.authenticatorData),
          signature: bufferToBase64url(credential.response.signature),
          userHandle: credential.response.userHandle ? bufferToBase64url(credential.response.userHandle) : undefined,
        },
      };

      const result = await api.post(`/fingerprint/${p.id}/sign-in-verify`, assertion);
      setResultLabel(result.log.timeOut ? 'Signed out' : 'Signed in');
      setStep(STEPS.DONE);
      setTimeout(reset, 2800);
    } catch (err) {
      setError(err.message || 'Fingerprint scan failed - try again');
      setStep(STEPS.ERROR);
    }
  };

  const reset = () => {
    setStep(STEPS.SEARCH);
    setQuery('');
    setMatches([]);
    setPerson(null);
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
                  onClick={() => pick(p)}
                  style={{ padding: '12px 14px', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--gray-200)', marginBottom: 8 }}
                >
                  <strong>{p.fullName}</strong>
                  {p.department && <span style={{ color: 'var(--gray-500)' }}> · {p.department}</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {step === STEPS.SCANNING && (
          <>
            <div style={{ fontSize: 44, marginBottom: 8 }}>👆</div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>
              Follow the prompt on your device, {person.fullName.split(' ')[0]}
            </p>
            <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>Waiting for fingerprint...</p>
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

        {step === STEPS.ERROR && (
          <>
            <div style={{ fontSize: 44, marginBottom: 8 }}>⚠</div>
            <p style={{ fontSize: 15, color: 'var(--danger)' }}>{error}</p>
            <button className="btn btn-primary" onClick={reset}>Try again</button>
          </>
        )}
      </div>

      <Link to="/" style={{ position: 'absolute', bottom: 16, right: 20, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
        Exit sign-in screen
      </Link>
    </div>
  );
}