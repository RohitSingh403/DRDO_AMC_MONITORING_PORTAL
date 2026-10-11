import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="border border-line bg-white px-5 py-8">
      <p className="font-mono text-[12px] text-muted">404</p>
      <h1 className="mt-2 text-xl font-semibold">That page is not on the desk</h1>
      <Link to="/" className="mt-3 inline-block text-sm text-link">Back to the board</Link>
    </div>
  );
}
