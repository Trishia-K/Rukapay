export default function SignaturePreview({ points, width = 140, height = 40 }) {
  if (!points) return null;
  return (
    <svg width={width} height={height} viewBox="0 0 400 160">
      <polyline points={points} fill="none" stroke="#0b1a3a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}