import { Outlet } from 'react-router-dom';
import NavBar from './NavBar.jsx';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="app-content px-4 pb-10">
        <Outlet />
      </main>
    </div>
  );
}
