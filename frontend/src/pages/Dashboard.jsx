import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const TYPE_LABEL = { training: 'Training', department: 'Department', general: 'General', client: 'Client', other: 'Other' };

export default function Dashboard() {
  const [todayLog, setTodayLog] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [onLeave, setOnLeave] = useState([]);

  useEffect(() => {
    api.get('/attendance/today').then(setTodayLog).catch(() => {});
    api.get('/meetings').then(setMeetings).catch(() => {});
    api.get('/leave/today').then(setOnLeave).catch(() => {});
  }, []);

  const stillIn = todayLog.filter((l) => l.timeIn && !l.timeOut);

  return (
    <div>
      <h1 className="page-title">Today at RukaPay</h1>
      <p className="page-subtitle">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
        <div className="card">
          <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Signed in today</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{todayLog.length}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Currently in the building</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{stillIn.length}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>On leave / remote today</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{onLeave.length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <Link to="/sign-in-log" className="btn btn-outline" style={{ textDecoration: 'none' }}>View sign-in log</Link>
        <Link to="/sign-in" className="btn btn-gold" style={{ textDecoration: 'none' }}>Open sign-in screen</Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Upcoming & recent meetings</h3>
          <Link to="/meetings" className="btn btn-outline" style={{ textDecoration: 'none', fontSize: 13 }}>View all</Link>
        </div>
        {meetings.slice(0, 6).map((m) => (
          <Link key={m.id} to={`/meetings/${m.id}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 4px', textDecoration: 'none', color: 'inherit', borderBottom: '1px solid var(--gray-200)' }}>
            <span>{m.title} {m.department && <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>· {m.department}</span>}</span>
            <span className={`badge badge-${m.type}`}>{TYPE_LABEL[m.type]}</span>
          </Link>
        ))}
        {meetings.length === 0 && <p style={{ color: 'var(--gray-500)' }}>No meetings scheduled yet</p>}
      </div>
    </div>
  );
}
