'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import SearchModal from './SearchModal';
import AnnouncementBar from './AnnouncementBar';

interface Category {
  id: number;
  name: string;
  slug: string;
}

type Audience = 'men' | 'women' | 'baby' | 'unisex';

const SHOP_ALL_AUDIENCES: { key: Audience; label: string }[] = [
  { key: 'men', label: 'Men' },
  { key: 'women', label: 'Women' },
  { key: 'baby', label: 'Baby' },
  { key: 'unisex', label: 'Unisex' },
];

export default function Navbar() {
  const { totalItems, openCart } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDropdown, setOpenDropdown] = useState<null | 'shop' | 'products'>(null);
  const [openSubmenu, setOpenSubmenu] = useState<Audience | null>(null);
  const [mobileGroup, setMobileGroup] = useState<null | 'shop' | 'products'>(null);
  const [mobileSubGroup, setMobileSubGroup] = useState<Audience | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]));
  }, []);

  // Close any open dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-nav-dropdown]')) {
        setOpenDropdown(null);
        setOpenSubmenu(null);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleEnter = (which: 'shop' | 'products') => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(which);
    if (which !== 'shop') setOpenSubmenu(null);
  };

  const handleLeave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpenDropdown(null);
      setOpenSubmenu(null);
    }, 150);
  };

  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileGroup(null);
    setMobileSubGroup(null);
  };

  return (
    <>
      {/* Top announcement bar (coupons + contact) */}
      <AnnouncementBar />

      {/* Main navbar */}
      <nav
        className={`sticky top-0 z-40 bg-white transition-shadow ${
          scrolled ? 'shadow-md' : 'border-b border-gray-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative flex items-center justify-between h-20">
            {/* Logo — left */}
            <Link href="/" className="flex items-center gap-2.5 leading-none flex-shrink-0">
              <Image src="/logo.png" alt="ARON" width={44} height={44} className="object-contain" priority />
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-wide uppercase">ARON</span>
                <span className="hidden lg:block text-base tracking-wider text-gray-500 uppercase">
                  Cosmetics &amp; Fashion
                </span>
              </div>
            </Link>

            {/* Desktop nav — absolutely centered relative to full header */}
            <div className="hidden md:flex items-center gap-5 absolute left-1/2 -translate-x-1/2">
              <Link
                href="/"
                className="text-base font-medium text-gray-700 hover:text-black transition-colors relative group whitespace-nowrap"
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full" />
              </Link>

              {/* Shop All dropdown */}
              <div
                data-nav-dropdown
                className="relative"
                onMouseEnter={() => handleEnter('shop')}
                onMouseLeave={handleLeave}
              >
                <Link
                  href="/products"
                  className="text-base font-medium text-gray-700 hover:text-black transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  Shop All
                  <ChevronDown className="w-3.5 h-3.5" />
                </Link>
                {openDropdown === 'shop' && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2">
                    <div className="bg-white rounded-md shadow-lg border border-gray-100 py-2 min-w-[200px]">
                      <Link
                        href="/products"
                        onClick={() => {
                          setOpenDropdown(null);
                          setOpenSubmenu(null);
                        }}
                        className="block px-4 py-2 text-base text-gray-700 hover:bg-gray-100 hover:text-black transition-colors whitespace-nowrap"
                      >
                        All Products
                      </Link>
                      {SHOP_ALL_AUDIENCES.map((aud) => (
                        <div
                          key={aud.key}
                          className="relative"
                          onMouseEnter={() => setOpenSubmenu(aud.key)}
                        >
                          <Link
                            href={`/products?audience=${aud.key}`}
                            onClick={() => {
                              setOpenDropdown(null);
                              setOpenSubmenu(null);
                            }}
                            className="flex items-center justify-between gap-4 px-4 py-2 text-base text-gray-700 hover:bg-gray-100 hover:text-black transition-colors whitespace-nowrap"
                          >
                            <span>{aud.label}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                          </Link>
                          {openSubmenu === aud.key && (
                            <div className="absolute left-full top-0 pl-1">
                              <div className="bg-white rounded-md shadow-lg border border-gray-100 py-2 min-w-[180px]">
                                {sortedCategories.length === 0 ? (
                                  <div className="px-4 py-2 text-base text-gray-400">Loading…</div>
                                ) : (
                                  sortedCategories.map((c) => (
                                    <Link
                                      key={c.id}
                                      href={`/products?audience=${aud.key}&category=${c.slug}`}
                                      onClick={() => {
                                        setOpenDropdown(null);
                                        setOpenSubmenu(null);
                                      }}
                                      className="block px-4 py-2 text-base text-gray-700 hover:bg-gray-100 hover:text-black transition-colors whitespace-nowrap"
                                    >
                                      {c.name}
                                    </Link>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Products (categories) dropdown */}
              <div
                data-nav-dropdown
                className="relative"
                onMouseEnter={() => handleEnter('products')}
                onMouseLeave={handleLeave}
              >
                <Link
                  href="/products"
                  className="text-base font-medium text-gray-700 hover:text-black transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  Products
                  <ChevronDown className="w-3.5 h-3.5" />
                </Link>
                {openDropdown === 'products' && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2">
                    <div className="bg-white rounded-md shadow-lg border border-gray-100 py-2 min-w-[180px]">
                      {sortedCategories.length === 0 ? (
                        <div className="px-4 py-2 text-base text-gray-400">Loading…</div>
                      ) : (
                        sortedCategories.map((c) => (
                          <Link
                            key={c.id}
                            href={`/products?category=${c.slug}`}
                            onClick={() => setOpenDropdown(null)}
                            className="block px-4 py-2 text-base text-gray-700 hover:bg-gray-100 hover:text-black transition-colors whitespace-nowrap"
                          >
                            {c.name}
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/track-order"
                className="text-base font-medium text-gray-700 hover:text-black transition-colors relative group whitespace-nowrap"
              >
                Track Order
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full" />
              </Link>

              <Link
                href="/faq"
                className="text-base font-medium text-gray-700 hover:text-black transition-colors relative group whitespace-nowrap"
              >
                FAQ
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full" />
              </Link>
            </div>

            {/* Icons — right */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-1 hover:text-gray-600 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={openCart}
                className="relative p-1 hover:text-gray-600 transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-base min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center font-bold leading-none">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>
              <button
                className="md:hidden p-1"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-4 py-3 space-y-1">
              <Link
                href="/"
                onClick={closeMobile}
                className="block py-2.5 text-base font-medium text-gray-700 hover:text-black border-b border-gray-100"
              >
                Home
              </Link>

              {/* Shop All collapsible */}
              <div className="border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setMobileGroup(mobileGroup === 'shop' ? null : 'shop')}
                  className="w-full flex items-center justify-between py-2.5 text-base font-medium text-gray-700 hover:text-black"
                >
                  Shop All
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      mobileGroup === 'shop' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {mobileGroup === 'shop' && (
                  <div className="pb-2 pl-4 space-y-1">
                    <Link
                      href="/products"
                      onClick={closeMobile}
                      className="block py-2 text-base text-gray-700 hover:text-black"
                    >
                      All Products
                    </Link>
                    {SHOP_ALL_AUDIENCES.map((aud) => (
                      <div key={aud.key} className="border-l border-gray-100 pl-2">
                        <button
                          type="button"
                          onClick={() =>
                            setMobileSubGroup(mobileSubGroup === aud.key ? null : aud.key)
                          }
                          className="w-full flex items-center justify-between py-2 text-base text-gray-700 hover:text-black"
                        >
                          {aud.label}
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              mobileSubGroup === aud.key ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {mobileSubGroup === aud.key && (
                          <div className="pl-3 pb-1 space-y-1">
                            {sortedCategories.length === 0 ? (
                              <span className="block py-1.5 text-base text-gray-400">Loading…</span>
                            ) : (
                              sortedCategories.map((c) => (
                                <Link
                                  key={c.id}
                                  href={`/products?audience=${aud.key}&category=${c.slug}`}
                                  onClick={closeMobile}
                                  className="block py-1.5 text-base text-gray-600 hover:text-black"
                                >
                                  {c.name}
                                </Link>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Products collapsible */}
              <div className="border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setMobileGroup(mobileGroup === 'products' ? null : 'products')}
                  className="w-full flex items-center justify-between py-2.5 text-base font-medium text-gray-700 hover:text-black"
                >
                  Products
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      mobileGroup === 'products' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {mobileGroup === 'products' && (
                  <div className="pb-2 pl-4 space-y-1">
                    {sortedCategories.length === 0 ? (
                      <span className="block py-2 text-base text-gray-400">Loading…</span>
                    ) : (
                      sortedCategories.map((c) => (
                        <Link
                          key={c.id}
                          href={`/products?category=${c.slug}`}
                          onClick={closeMobile}
                          className="block py-2 text-base text-gray-700 hover:text-black"
                        >
                          {c.name}
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>

              <Link
                href="/track-order"
                onClick={closeMobile}
                className="block py-2.5 text-base font-medium text-gray-700 hover:text-black border-b border-gray-100"
              >
                Track Order
              </Link>
              <Link
                href="/faq"
                onClick={closeMobile}
                className="block py-2.5 text-base font-medium text-gray-700 hover:text-black"
              >
                FAQ
              </Link>
            </div>
          </div>
        )}
      </nav>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
