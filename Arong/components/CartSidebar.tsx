'use client';

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, totalItems } = useCart();

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const shipping = subtotal > 0 ? (subtotal >= 1000 ? 0 : 60) : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-lg">Shopping cart</h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <svg className="w-16 h-16 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="font-medium">Your cart is empty</p>
              <button
                onClick={closeCart}
                className="mt-3 text-sm underline text-gray-600 hover:text-black"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.product_id}-${item.variant_name}`} className="flex gap-3">
                <div className="relative w-20 h-20 flex-shrink-0 bg-gray-50 border">
                  <Image
                    src={item.image}
                    alt={item.product_name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug line-clamp-2">
                    {item.product_name}
                  </p>
                  {item.variant_name && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Selected Option: {item.variant_name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Unit Price: BDT. {item.price.toFixed(2)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border">
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.variant_name, item.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.variant_name, item.quantity + 1)
                        }
                        aria-label="Increase quantity"
                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product_id, item.variant_name)}
                      aria-label="Remove item"
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">
                    BDT. {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-5">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Subtotal ({totalItems} items)</span>
              <span>BDT. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-600">Shipping</span>
              <span className="text-gray-500">{shipping === 0 ? 'Free' : `BDT. ${shipping}`}</span>
            </div>
            <Link href="/checkout" onClick={closeCart}>
              <button className="w-full bg-black text-white py-3.5 flex items-center justify-between px-5 font-medium hover:bg-gray-900 transition-colors">
                <span>Proceed To Checkout</span>
                <span>BDT. {subtotal.toFixed(2)}</span>
              </button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
