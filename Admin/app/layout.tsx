import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ARONG Admin Panel',
  description: 'Admin dashboard for ARONG Cosmetics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
