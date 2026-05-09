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
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 flex flex-col shadow-2xl">
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
                className="mt-3 text-base underline text-gray-600 hover:text-black"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.product_id}-${item.variant_name}`} className="flex gap-3">
                <div className="relative w-24 h-24 flex-shrink-0 bg-gray-50 border rounded-sm overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.product_name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium leading-snug line-clamp-2">
                    {item.product_name}
                  </p>
                  {item.variant_name && (
                    <p className="text-base text-gray-500 mt-0.5">
                      {item.variant_name}
                    </p>
                  )}
                  <p className="text-base font-semibold text-gray-700 mt-0.5">
                    BDT. {item.price.toFixed(2)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border rounded-sm">
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.variant_name, item.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-base font-medium">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.variant_name, item.quantity + 1)
                        }
                        aria-label="Increase quantity"
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-base">
                        BDT. {(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(item.product_id, item.variant_name)}
                        aria-label="Remove item"
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-5 space-y-2">
            <div className="flex justify-between text-base">
              <span className="text-gray-600">Subtotal ({totalItems} items)</span>
              <span className="font-medium">BDT. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-gray-600">Shipping</span>
              <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'Free' : `BDT. ${shipping}`}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-2 mt-1">
              <span>Total</span>
              <span>BDT. {(subtotal + shipping).toFixed(2)}</span>
            </div>
            <Link href="/checkout" onClick={closeCart} className="block mt-3">
              <button className="w-full bg-black text-white py-4 flex flex-col items-center justify-center font-semibold hover:bg-gray-900 transition-colors rounded-sm gap-0.5">
                <span className="text-base">Proceed To Checkout</span>
                <span className="text-base opacity-75">BDT. {(subtotal + shipping).toFixed(2)}</span>
              </button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
