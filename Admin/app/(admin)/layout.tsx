import Sidebar from '@/components/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* On mobile: full width with top padding for the fixed top bar (h-14).
          On md+: shifted right by sidebar width (ml-64). */}
      <main className="flex-1 p-4 sm:p-6 pt-20 md:pt-6 md:ml-64 min-w-0">
        {children}
      </main>
    </div>
  );
}
