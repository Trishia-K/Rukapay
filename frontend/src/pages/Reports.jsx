import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Reports() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const download = () => {
    window.open(`${API_BASE}/attendance/report?year=${year}&month=${month}`, '_blank');
  };

  return (
    <div>
      <h1 className="page-title">Reports</h1>
      <p className="page-subtitle">Export a month's attendance as a spreadsheet, ready to share with management</p>

      <div className="card" style={{ maxWidth: 420 }}>
        <label className="field-label">Month</label>
        <select className="field-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>

        <label className="field-label">Year</label>
        <input type="number" className="field-input" value={year} onChange={(e) => setYear(Number(e.target.value))} />

        <button className="btn btn-primary" onClick={download}>Download attendance sheet (.xlsx)</button>
        <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 12 }}>
          Each row is a person, each column is a working day: P = present, A = absent, L = on leave, R = remote.
        </p>
      </div>
    </div>
  );
}
