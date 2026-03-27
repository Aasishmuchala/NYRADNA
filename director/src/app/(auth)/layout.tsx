import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <Sidebar />
      <TopNav />
      <main className="md:ml-64 pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}
