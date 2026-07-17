import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { registerFingerprintFor } from '../lib/webauthn';

export default function RegisterFingerprint() {
  const { personId } = useParams();
  const [person, setPerson] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    api.get(`/people/${personId}/basic`).then(setPerson).catch(() => setStatus('This link is invalid or has expired.'));
  }, [personId]);

  const register = async () => {
    setStatus('Follow the prompt on this device...');
    try {
      await registerFingerprintFor(personId);
      setStatus('Registered \u2713 - you can close this page now.');
    } catch (err) {
      setStatus(err.message || 'Failed - try again.');
    }
  };

  return (
    <div className="kiosk-shell">
      <div className="kiosk-card">
        <div className="kiosk-title">RukaTrack Fingerprint Setup</div>
        {person && <p style={{ color: 'var(--gray-500)' }}>Setting up fingerprint sign-in for <strong>{person.fullName}</strong></p>}
        <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>Use your own phone or laptop - this ties your fingerprint sign-in to this device.</p>
        <button className="btn btn-primary" onClick={register}>Register my fingerprint</button>
        {status && <p style={{ marginTop: 16, fontSize: 14 }}>{status}</p>}
      </div>
    </div>
  );
}