import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function SignInLog() {
  const [log, setLog] = useState([]);

  useEffect(() => {
    api.get('/attendance/today').then(setLog).catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Sign-In / Sign-Out Log</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/sign-in" className="btn btn-gold" style={{ textDecoration: 'none' }}>Open sign-in screen</Link>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Name</th><th>Department</th><th>Time in</th><th>Time out</th></tr>
          </thead>
          <tbody>
            {log.map((l) => (
              <tr key={l.id}>
                <td>{l.person.fullName}</td>
                <td>{l.person.department || '—'}</td>
                <td>{l.timeIn ? new Date(l.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td>{l.timeOut ? new Date(l.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
              </tr>
            ))}
            {log.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>Nobody has signed in yet today</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
