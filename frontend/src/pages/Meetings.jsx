import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const TYPE_LABEL = { training: 'Training', department: 'Department Meeting', general: 'General / Staff Meeting', client: 'Client / Partner Meeting', other: 'Other' };

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [departments, setDepartments] = useState([]);
 const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ department: '', date: '' });
  const [formError, setFormError] = useState('');
  const [people, setPeople] = useState([]);
  const [form, setForm] = useState({
    title: '', type: 'department', date: '', mode: 'physical', location: '', meetingLink: '', department: '', facilitatorId: '',
  });
  const navigate = useNavigate();

  const load = () => {
    const params = new URLSearchParams();
    if (filters.department) params.set('department', filters.department);
    if (filters.date) params.set('date', filters.date);
    else params.set('when', 'upcoming');
    api.get(`/meetings?${params.toString()}`).then(setMeetings).catch(() => {});
  };
  useEffect(load, [filters]);
  useEffect(() => { api.get('/people/departments').then(setDepartments); }, []);
  useEffect(() => { api.get('/people').then(setPeople); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = { ...form, date: `${form.date}:00+03:00` };
      const meeting = await api.post('/meetings', form);
      navigate(`/meetings/${meeting.id}`);
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Meetings</h1>
          <p className="page-subtitle">Schedule a meeting and its attendance sheet is ready instantly</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ Schedule a meeting'}
        </button>
      </div>

      {showForm && (
        <form className="card" onSubmit={submit} style={{ marginBottom: 24 }}>
          <label className="field-label">Meeting title</label>
          <input className="field-input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

          <label className="field-label">Meeting type</label>
          <select className="field-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {Object.entries(TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <label className="field-label">Facilitator</label>
          <select className="field-select" value={form.facilitatorId} onChange={(e) => setForm({ ...form, facilitatorId: e.target.value })}>
            <option value="">Not set</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>

          <label className="field-label">Who is this for?</label>
          <select className="field-select" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
            <option value="">Everyone</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <label className="field-label">Date and time</label>
          <input type="datetime-local" className="field-input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />

          <label className="field-label">Physical or online?</label>
          <select className="field-select" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
            <option value="physical">Physical</option>
            <option value="online">Online</option>
          </select>

          {form.mode === 'physical' ? (
            <>
              <label className="field-label">Location</label>
              <input className="field-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </>
          ) : (
            <>
              <label className="field-label">Meeting link</label>
              <input className="field-input" placeholder="https://..." value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} />
            </>
          )}

          {formError && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: -8, marginBottom: 12 }}>{formError}</p>}
          <button className="btn btn-primary" type="submit">Create meeting & send invites</button>
        </form>
      )}

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div>
          <label className="field-label">Filter by department</label>
          <select className="field-select" style={{ marginBottom: 0 }} value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
            <option value="">All departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Filter by date</label>
          <input type="date" className="field-input" style={{ marginBottom: 0 }} value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Meeting</th><th>Type</th><th>For</th><th>Date</th><th>Mode</th><th>Attendees</th><th></th></tr>
          </thead>
          <tbody>
            {meetings.map((m) => (
              <tr key={m.id}>
                <td><strong>{m.title}</strong></td>
                <td><span className={`badge badge-${m.type}`}>{TYPE_LABEL[m.type]}</span></td>
                <td>{m.department || 'Everyone'}</td>
                <td>{new Date(m.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Kampala' })}</td>
                <td style={{ textTransform: 'capitalize' }}>{m.mode}</td>
                <td>{m.attendees?.length || 0}</td>
                <td>
                  <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => navigate(`/meetings/${m.id}`)}>
                    View attendance
                  </button>
                </td>
              </tr>
            ))}
            {meetings.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>No meetings match this filter</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
