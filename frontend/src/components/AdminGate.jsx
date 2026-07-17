import { useState } from 'react';
import { api } from '../api/client';

export default function AdminGate({ children }) {
  const [unlocked, setUnlocked] = useState(api.hasAdminKey());
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.adminLogin(password);
      api.setAdminKey(password);
      setUnlocked(true);
    } catch {
      setError('Incorrect password.');
    }
  };

  if (unlocked) return children;

  return (
    <div className="card" style={{ maxWidth: 360, margin: '80px auto' }}>
      <h3 style={{ marginTop: 0 }}>Admin sign-in required</h3>
      <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Only administrators can manage the team.</p>
      <form onSubmit={submit}>
        <input type="password" className="field-input" placeholder="Admin password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
        <button className="btn btn-primary" type="submit">Unlock</button>
      </form>
    </div>
  );
}