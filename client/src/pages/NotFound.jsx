import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-24 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-brass">404</p>
      <h1 className="mt-3 font-serif text-4xl">That page is not on the desk</h1>
      <Link to="/" className="mt-6 inline-block text-sm text-brass">Return to the dashboard</Link>
    </div>
  );
}
