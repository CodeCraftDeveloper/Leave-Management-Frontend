import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import TopNavbar from '../components/TopNavbar';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopNavbar />
        <main className="flex-1 px-4 lg:px-8 py-5 pb-24 lg:pb-8 max-w-6xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
