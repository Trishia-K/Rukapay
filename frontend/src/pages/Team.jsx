import { useEffect, useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { api } from '../api/client';

export default function Team() {
  const [people, setPeople] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newPerson, setNewPerson] = useState({ fullName: '', email: '', department: '' });
  const [leaveFor, setLeaveFor] = useState(null);
  const [leaveForm, setLeaveForm] = useState({ type: 'leave', startDate: '', endDate: '', note: '' });
  const [fingerprintStatus, setFingerprintStatus] = useState({});
  const [onLeaveToday, setOnLeaveToday] = useState({});

  const load = () => { api.get('/people').then(setPeople); };
  useEffect(load, []);
  useEffect(() => { api.get('/people/departments').then(setDepartments); }, []);

  const loadLeaveToday = () => {
    api.get('/leave/today').then((rows) => {
      const map = {};
      rows.forEach((r) => { map[r.personId] = r.type; });
      setOnLeaveToday(map);
    });
  };
  useEffect(loadLeaveToday, [people]);

  useEffect(() => {
    api.get('/attendance/stats').then((rows) => {
      const map = {};
      rows.forEach((r) => { map[r.person.id] = r; });
      setStats(map);
    });
  }, [people]);

  const addPerson = async (e) => {
    e.preventDefault();
    await api.post('/people', newPerson);
    setNewPerson({ fullName: '', email: '', department: '' });
    setShowAdd(false);
    load();
  };

  const removePerson = (p) => {
    if (!confirm(`Remove ${p.fullName} from the team? This deletes their attendance history too.`)) return;
    api.delete(`/people/${p.id}`).then(load);
  };

  const submitLeave = async (e) => {
    e.preventDefault();
    await api.post('/leave', { personId: leaveFor.id, ...leaveForm });
    setLeaveFor(null);
    setLeaveForm({ type: 'leave', startDate: '', endDate: '', note: '' });
    loadLeaveToday();
  };

  const registerFingerprint = async (person) => {
    setFingerprintStatus({ ...fingerprintStatus, [person.id]: 'Follow the prompt on this device...' });
    try {
      const options = await api.post(`/fingerprint/${person.id}/register-options`, {});
      const attestation = await startRegistration(options);
      await api.post(`/fingerprint/${person.id}/register-verify`, attestation);
      setFingerprintStatus({ ...fingerprintStatus, [person.id]: 'Registered ✓' });
      load();
    } catch (err) {
      setFingerprintStatus({ ...fingerprintStatus, [person.id]: err.message || 'Failed - try again' });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">Register staff, set up their fingerprint, and track attendance</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd((s) => !s)}>
          {showAdd ? 'Cancel' : '+ Add person'}
        </button>
      </div>

      {showAdd && (
        <form className="card" onSubmit={addPerson} style={{ marginBottom: 24 }}>
          <label className="field-label">Full name</label>
          <input className="field-input" required value={newPerson.fullName} onChange={(e) => setNewPerson({ ...newPerson, fullName: e.target.value })} />

          <label className="field-label">Email (for meeting invites)</label>
          <input type="email" className="field-input" value={newPerson.email} onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })} />

          <label className="field-label">Department</label>
          <select className="field-select" value={newPerson.department} onChange={(e) => setNewPerson({ ...newPerson, department: e.target.value })}>
            <option value="">Select department</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <button className="btn btn-primary" type="submit">Add to team</button>
        </form>
      )}

      <div className="card">
        <table>
          <thead>
            <tr><th>Name</th><th>Department</th><th>Fingerprint</th><th>Attendance %</th><th>Early sign-outs</th><th></th></tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.fullName}
                  {onLeaveToday[p.id] && (
                    <span className="badge" style={{ marginLeft: 6, background: onLeaveToday[p.id] === 'remote' ? '#eef2ff' : '#fff4e0', color: onLeaveToday[p.id] === 'remote' ? '#3b4ec4' : 'var(--warning)' }}>
                      {onLeaveToday[p.id] === 'remote' ? 'Remote today' : 'On leave today'}
                    </span>
                  )}
                </td>
                <td>{p.department || '—'}</td>
                <td>
                  {p.webauthnCredentialId
                    ? <span style={{ color: 'var(--success)', fontSize: 13 }}>Registered ✓</span>
                    : (
                      <div>
                        <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => registerFingerprint(p)}>
                          Register fingerprint
                        </button>
                        {fingerprintStatus[p.id] && (
                          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>{fingerprintStatus[p.id]}</div>
                        )}
                      </div>
                    )}
                </td>
                <td>{stats[p.id]?.attendancePercentage ?? '—'}%</td>
                <td>{stats[p.id]?.earlySignOuts ?? '—'}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => setLeaveFor(p)}>Mark leave/remote</button>
                  <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 10px', color: 'var(--danger)' }} onClick={() => removePerson(p)}>Remove</button>
                </td>
              </tr>
            ))}
            {people.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>No one on the team yet - add your first person above</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {leaveFor && (
        <form className="card" style={{ marginTop: 20 }} onSubmit={submitLeave}>
          <h3 style={{ marginTop: 0 }}>Mark leave/remote for {leaveFor.fullName}</h3>
          <label className="field-label">Type</label>
          <select className="field-select" value={leaveForm.type} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}>
            <option value="leave">On leave</option>
            <option value="remote">Working remotely</option>
          </select>
          <label className="field-label">From</label>
          <input type="date" required className="field-input" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} />
          <label className="field-label">To</label>
          <input type="date" required className="field-input" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} />
          <label className="field-label">Note (optional)</label>
          <input className="field-input" value={leaveForm.note} onChange={(e) => setLeaveForm({ ...leaveForm, note: e.target.value })} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit">Save</button>
            <button className="btn btn-outline" type="button" onClick={() => setLeaveFor(null)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
