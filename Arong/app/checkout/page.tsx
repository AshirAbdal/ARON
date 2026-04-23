'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const DIVISIONS: Record<string, string[]> = {
  Dhaka: ['Dhaka', 'Gazipur', 'Narayanganj', 'Manikganj', 'Munshiganj', 'Narsingdi', 'Tangail', 'Faridpur', 'Gopalganj'],
  Chittagong: ['Chittagong', "Cox's Bazar", 'Comilla', 'Feni', 'Noakhali', 'Lakshmipur', 'Chandpur', 'Brahmanbaria'],
  Sylhet: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  Rajshahi: ['Rajshahi', 'Bogra', 'Naogaon', 'Natore', 'Chapainawabganj', 'Pabna', 'Sirajganj', 'Joypurhat'],
  Khulna: ['Khulna', 'Bagerhat', 'Satkhira', 'Jessore', 'Narail', 'Magura', 'Jhenaidah', 'Kushtia', 'Chuadanga', 'Meherpur'],
  Barishal: ['Barishal', 'Bhola', 'Patuakhali', 'Pirojpur', 'Jhalokati', 'Barguna'],
  Rangpur: ['Rangpur', 'Dinajpur', 'Nilphamari', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Thakurgaon', 'Panchagarh'],
  Mymensingh: ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'],
};

export default function CheckoutPage() {
  const { items, subtotal, clearCart, updateQuantity, removeItem, hydrated } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    division: '',
    city: '',
    notes: '',
  });

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [couponValid, setCouponValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cities = form.division ? DIVISIONS[form.division] || [] : [];
  const shipping = form.city === 'Sherpur' ? 0 : form.division ? 120 : 0;
  const total = subtotal + shipping - discount;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'division' ? { city: '' } : {}),
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch(
        `/api/coupon?code=${encodeURIComponent(couponCode)}&subtotal=${subtotal}`
      );
      const data = await res.json();
      if (res.ok && data.valid) {
        setDiscount(data.discount);
        setCouponMsg(`Coupon applied! You save ৳${data.discount}`);
        setCouponValid(true);
      } else {
        setDiscount(0);
        setCouponMsg(data.error || 'Invalid coupon');
        setCouponValid(false);
      }
    } catch {
      setCouponMsg('Failed to apply coupon');
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!form.division) errs.division = 'Please select your division';
    if (!form.city) errs.city = 'Please select your city';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (items.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          coupon_code: couponValid ? couponCode : undefined,
          items: items.map((i) => ({
            product_id: i.product_id,
            product_name: i.product_name,
            variant_name: i.variant_name,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        clearCart();
        router.push(`/order-success?order=${data.order_number}`);
      } else {
        alert(data.error || 'Failed to place order');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 text-sm">Loading cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-lg font-medium mb-4">Your cart is empty</p>
        <Link
          href="/products"
          className="inline-block bg-black text-white px-8 py-3 hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-8">
        {/* Left: Shipping Details */}
        <div>
          <h2 className="font-semibold text-lg mb-1">Shipping Details</h2>
          <p className="text-sm text-gray-500 mb-6">Please enter your shipping details.</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleInput}
                placeholder="Enter your full name"
                className={`w-full border px-3 py-2.5 text-sm focus:outline-none focus:border-black ${
                  errors.full_name ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleInput}
                placeholder="Enter your phone number"
                className={`w-full border px-3 py-2.5 text-sm focus:outline-none focus:border-black ${
                  errors.phone ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Order Note (Optional)</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleInput}
              placeholder="If you have any special request or customization, please mention it here. (Optional)"
              rows={3}
              className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black resize-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Full Address Details <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleInput}
              placeholder="House and street details"
              rows={3}
              className={`w-full border px-3 py-2.5 text-sm focus:outline-none focus:border-black resize-none ${
                errors.address ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Division <span className="text-red-500">*</span>
            </label>
            <select
              aria-label="Select division"
              name="division"
              value={form.division}
              onChange={handleInput}
              className={`w-full border px-3 py-2.5 text-sm focus:outline-none focus:border-black ${
                errors.division ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">Select your division</option>
              {Object.keys(DIVISIONS).map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
            {errors.division && <p className="text-xs text-red-500 mt-1">{errors.division}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <select
              aria-label="Select city"
              name="city"
              value={form.city}
              onChange={handleInput}
              disabled={!form.division}
              className={`w-full border px-3 py-2.5 text-sm focus:outline-none focus:border-black disabled:bg-gray-50 disabled:text-gray-400 ${
                errors.city ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">Select your city</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            {!form.division && (
              <p className="text-xs text-gray-500 mt-1">Please select the division first.</p>
            )}
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
          </div>

          <div className="bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600">
            Note: We are delivering to Bangladesh only.
          </div>
        </div>

        {/* Right: Order Summary */}
        <div>
          <h2 className="font-semibold text-lg mb-6">Your Order</h2>
          <div className="border rounded-sm p-5">
            {/* Cart items */}
            <div className="space-y-4 mb-4">
              {items.map((item) => (
                <div key={`${item.product_id}-${item.variant_name}`} className="flex gap-3">
                  <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 border">
                    <Image
                      src={
                        item.image.startsWith('http')
                          ? item.image
                          : `http://localhost:3000${item.image}`
                      }
                      alt={item.product_name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-xs text-gray-500">
                        Selected Option: {item.variant_name} - {item.price}
                        {' '}(Price of 1 items)
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center border">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            updateQuantity(item.product_id, item.variant_name, item.quantity - 1)
                          }
                          className="w-6 h-6 flex items-center justify-center hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() =>
                            updateQuantity(item.product_id, item.variant_name, item.quantity + 1)
                          }
                          className="w-6 h-6 flex items-center justify-center hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove item"
                        onClick={() => removeItem(item.product_id, item.variant_name)}
                        className="p-0.5 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-medium">
                    ৳{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setCouponMsg('');
                  setCouponValid(false);
                  setDiscount(0);
                }}
                className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
              />
              <button
                type="button"
                onClick={handleCoupon}
                className="px-4 py-2 border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
              >
                Apply
              </button>
            </div>
            {couponMsg && (
              <p className={`text-xs mb-3 ${couponValid ? 'text-green-600' : 'text-red-500'}`}>
                {couponMsg}
              </p>
            )}

            {/* Totals */}
            <div className="space-y-2 text-sm border-t pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-500">
                  {form.division ? `৳${shipping}` : 'Select your city'}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-৳{discount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Total</span>
                <span>৳{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mt-4 border-t pt-4">
              <h3 className="font-semibold text-sm mb-3">Payment Method</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="payment" defaultChecked className="accent-black" />
                <span className="text-sm">Cash on Delivery</span>
              </label>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Before placing the order, please do read our{' '}
              <Link href="/terms" className="underline">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-black text-white py-3.5 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
