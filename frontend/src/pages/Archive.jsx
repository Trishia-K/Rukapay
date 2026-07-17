import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const TYPE_LABEL = { training: 'Training', department: 'Department Meeting', general: 'General / Staff Meeting', client: 'Client / Partner Meeting', other: 'Other' };

export default function Archive() {
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/meetings?when=past').then(setMeetings).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="page-title">Archive</h1>
      <p className="page-subtitle">Past meetings and their attendance sheets</p>

      <div className="card">
        <table>
          <thead>
            <tr><th>Meeting</th><th>Type</th><th>For</th><th>Date</th><th>Signed in</th><th></th></tr>
          </thead>
          <tbody>
            {meetings.map((m) => (
              <tr key={m.id}>
                <td><strong>{m.title}</strong></td>
                <td><span className={`badge badge-${m.type}`}>{TYPE_LABEL[m.type]}</span></td>
                <td>{m.department || 'Everyone'}</td>
                <td>{new Date(m.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Kampala' })}</td>
                <td>{m.attendees?.filter((a) => a.signedAt).length || 0} of {m.attendees?.length || 0}</td>
                <td>
                  <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => navigate(`/meetings/${m.id}`)}>
                    View / print sheet
                  </button>
                </td>
              </tr>
            ))}
            {meetings.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>No past meetings yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}