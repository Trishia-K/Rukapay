import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import SignaturePad from '../components/SignaturePad';
import SignaturePreview from '../components/SignaturePreview';

export default function MeetingRoom() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [query, setQuery] = useState('');
  const [signingFor, setSigningFor] = useState(null);
  const [now, setNow] = useState(new Date());
  const [signError, setSignError] = useState('');

  const load = () => { api.get(`/meetings/${id}`).then(setMeeting); };
  useEffect(load, [id]);


  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(t);
  }, []);

  if (!meeting) return <p>Loading...</p>;

  const hasStarted = now >= new Date(meeting.date);

  const notSignedYet = meeting.attendees
    .filter((a) => !a.signedAt)
    .filter((a) => a.person.fullName.toLowerCase().includes(query.toLowerCase()));

  const confirmSign = async (svg) => {
    setSignError('');
    try {
      await api.post(`/meetings/${id}/sign`, { personId: signingFor.personId, signatureSvg: svg });
      setSigningFor(null);
      setQuery('');
      load();
    } catch (err) {
      setSignError(err.message);
    }
  };

  const signedCount = meeting.attendees.filter((a) => a.signedAt).length;

  return (
    <div>
      <div className="no-print">
        <h1 className="page-title">{meeting.title}</h1>
        <p className="page-subtitle">
          {new Date(meeting.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })} ·{' '}
          {meeting.department || 'Everyone'} ·{' '}
          {meeting.mode === 'online' ? (meeting.meetingLink || 'Online') : (meeting.location || 'Location TBC')} ·{' '}
          Code <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{meeting.code}</span>
        </p>

        {!hasStarted ? (
          <div className="card" style={{ marginBottom: 20, background: 'var(--gray-50)' }}>
            <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: 14 }}>
              Attendance opens at {new Date(meeting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
              this list will unlock automatically once the meeting starts.
            </p>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginTop: 0 }}>Sign attendance ({notSignedYet.length} not yet signed)</h3>
            {!signingFor && (
              <>
                <input
                  className="field-input"
                  placeholder="Filter by name (optional)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {notSignedYet.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setSigningFor(a)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, marginBottom: 6, border: '1px solid var(--gray-200)', cursor: 'pointer' }}
                  >
                    <span>{a.person.fullName} <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>· {a.person.department || '—'}</span></span>
                    <span style={{ fontSize: 12, color: 'var(--navy-accent)', fontWeight: 600 }}>Tap to sign</span>
                  </div>
                ))}
                {notSignedYet.length === 0 && (
                  <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
                    {meeting.attendees.length === 0 ? 'No one expected at this meeting yet.' : 'Everyone has signed in.'}
                  </p>
                )}
              </>
            )}

            {signingFor && (
              <div>
                <p style={{ fontSize: 14 }}>Sign below, {signingFor.person.fullName.split(' ')[0]}:</p>
                <SignaturePad onCapture={confirmSign} onCancel={() => setSigningFor(null)} />
                {signError && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{signError}</p>}
              </div>
            )}
          </div>
        )}

        <button className="btn btn-gold" onClick={() => window.print()}>Print attendance sheet</button>
        <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8 }}>
          In the print dialog, choose "Save as PDF".
        </p>
      </div>

      <div className="print-sheet">
        <table style={{ border: '2px solid #1a1a1a' }}>
          <tbody>
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', fontWeight: 700, fontSize: 16, textTransform: 'uppercase', border: '2px solid #1a1a1a', padding: '10px 8px' }}>
                {meeting.title} - Meeting Attendance
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, width: 110, border: '1px solid #1a1a1a' }}>Date:</td>
              <td colSpan={3} style={{ border: '1px solid #1a1a1a' }}>
                {new Date(meeting.date).toLocaleDateString('en-GB', { dateStyle: 'full', timeZone: 'Africa/Kampala' })}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, border: '1px solid #1a1a1a' }}>Facilitator:</td>
              <td colSpan={3} style={{ border: '1px solid #1a1a1a' }}>{meeting.facilitator?.fullName || '—'}</td>
            </tr>
            <tr>
              <th style={{ width: 40, border: '1px solid #1a1a1a' }}>No.</th>
              <th style={{ border: '1px solid #1a1a1a' }}>Full Name</th>
              <th style={{ border: '1px solid #1a1a1a' }}>Department</th>
              <th style={{ width: 140, border: '1px solid #1a1a1a' }}>Signature</th>
            </tr>
            {meeting.attendees.filter((a) => a.signedAt).map((a, i) => (
              <tr key={a.id}>
                <td style={{ textAlign: 'center', border: '1px solid #1a1a1a' }}>{i + 1}</td>
                <td style={{ border: '1px solid #1a1a1a' }}>{a.person.fullName}</td>
                <td style={{ border: '1px solid #1a1a1a' }}>{a.person.department || '—'}</td>
                <td style={{ border: '1px solid #1a1a1a' }}>{a.signatureSvg ? <SignaturePreview points={a.signatureSvg} /> : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 8 }}>
          
        </p>
      </div>
    </div>
  );
}