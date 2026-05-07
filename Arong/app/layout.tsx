import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartSidebar from '@/components/CartSidebar';

export const metadata: Metadata = {
  title: 'ARON - Cosmetics & Fashion',
  description:
    'Discover premium cosmetics, skincare, makeup, fragrances, and fashion accessories at ARON.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <CartSidebar />
        </CartProvider>
      </body>
    </html>
  );
}
