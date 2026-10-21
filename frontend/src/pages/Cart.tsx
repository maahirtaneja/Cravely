import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useState } from "react";
import type { ICart, IMenuItem, IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { VscLoading } from "react-icons/vsc";
import { BiArrowBack, BiMinus, BiPlus, BiShield } from "react-icons/bi";
import { CgShoppingCart } from "react-icons/cg";
import { TbTrash } from "react-icons/tb";

const Cart = () => {
  const { cart, subTotal, quauntity, fetchCart } = useAppData();
  const navigate = useNavigate();

  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [clearingCart, setClearingCart] = useState(false);

  if (!cart || cart.length === 0) {
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 text-center space-y-5 bg-[#F8FAFC]">
        <div className="h-20 w-20 rounded-3xl bg-amber-50 text-[#FB8C00] flex items-center justify-center shadow-inner">
          <CgShoppingCart size={40} />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h2 className="text-2xl font-extrabold text-[#0D2240]">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Good food is always cooking! Explore top restaurants near you and add your favourite dishes.
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="rounded-2xl bg-gradient-to-r from-[#0D2240] to-[#163A6B] px-6 py-3.5 text-xs font-bold text-white shadow-md shadow-[#0D2240]/20 hover:from-[#09182E] hover:to-[#0F294D] transition-all cursor-pointer"
        >
          Explore Restaurants
        </button>
      </div>
    );
  }

  const restaurant = cart[0].restaurantId as IRestaurant;
  const deliveryFee = subTotal < 250 ? 49 : 0;
  const platfromFee = 7;
  const grandTotal = subTotal + deliveryFee + platfromFee;

  const increaseQty = async (itemId: string) => {
    try {
      setLoadingItemId(itemId);
      await axios.put(
        `${restaurantService}/api/cart/inc`,
        { itemId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      await fetchCart();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingItemId(null);
    }
  };

  const decreaseQty = async (itemId: string) => {
    try {
      setLoadingItemId(itemId);
      await axios.put(
        `${restaurantService}/api/cart/dec`,
        { itemId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      await fetchCart();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingItemId(null);
    }
  };

  const clearCart = async () => {
    const confirm = window.confirm("Are you sure you want to clear your cart?");
    if (!confirm) return;
    try {
      setClearingCart(true);
      await axios.delete(`${restaurantService}/api/cart/clear`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      await fetchCart();
      toast.success("Cart cleared");
    } catch {
      toast.error("Failed to clear cart");
    } finally {
      setClearingCart(false);
    }
  };

  const checkout = () => {
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0D2240] transition cursor-pointer"
          >
            <BiArrowBack size={16} />
            Back to Restaurants
          </button>

          <button
            onClick={clearCart}
            disabled={clearingCart}
            className="inline-flex items-center gap-1 text-xs font-medium text-rose-500 hover:text-rose-700 transition cursor-pointer disabled:opacity-50"
          >
            <TbTrash size={15} />
            {clearingCart ? "Clearing..." : "Clear Cart"}
          </button>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Restaurant Info + Items (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Restaurant Summary Card */}
            <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#FB8C00]">
                  Ordering from
                </p>
                <h2 className="text-xl font-extrabold text-[#0D2240]">
                  {restaurant.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {restaurant.autoLocation?.formattedAddress}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  restaurant.isOpen
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {restaurant.isOpen ? "Open" : "Closed"}
              </span>
            </div>

            {/* Cart Items List */}
            <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-sm divide-y divide-slate-100">
              <h3 className="font-bold text-sm text-[#0D2240] pb-3">
                Items In Cart ({quauntity})
              </h3>

              {cart.map((cartItem: ICart) => {
                const item = cartItem.itemId as IMenuItem;
                const isLoading = loadingItemId === item._id;

                return (
                  <div
                    key={item._id}
                    className="flex items-center gap-4 py-4 first:pt-3 last:pb-1"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-2xl object-cover border border-slate-100 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-[#0D2240] truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs font-semibold text-[#FB8C00] mt-0.5">
                        ₹{item.price} each
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-2 py-1">
                      <button
                        className="rounded-lg p-1 text-slate-600 hover:text-black hover:bg-white transition cursor-pointer disabled:opacity-40"
                        disabled={isLoading}
                        onClick={() => decreaseQty(item._id)}
                      >
                        {isLoading ? (
                          <VscLoading size={14} className="animate-spin" />
                        ) : (
                          <BiMinus size={14} />
                        )}
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-[#0D2240]">
                        {cartItem.quauntity}
                      </span>
                      <button
                        className="rounded-lg p-1 text-slate-600 hover:text-black hover:bg-white transition cursor-pointer disabled:opacity-40"
                        disabled={isLoading}
                        onClick={() => increaseQty(item._id)}
                      >
                        {isLoading ? (
                          <VscLoading size={14} className="animate-spin" />
                        ) : (
                          <BiPlus size={14} />
                        )}
                      </button>
                    </div>

                    <p className="w-16 text-right font-bold text-sm text-[#0D2240]">
                      ₹{item.price * cartItem.quauntity}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-[#0D2240]">
                Bill Summary
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Item Total</span>
                  <span className="font-semibold text-slate-800">₹{subTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Partner Fee</span>
                  <span className="font-semibold text-slate-800">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="font-semibold text-slate-800">₹{platfromFee}</span>
                </div>

                {subTotal < 250 ? (
                  <div className="rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-800 font-medium border border-amber-200/60">
                    🛵 Add items worth <strong>₹{250 - subTotal}</strong> more to unlock <strong>FREE Delivery</strong>!
                  </div>
                ) : (
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-[11px] text-emerald-800 font-medium border border-emerald-200/60">
                    🎉 Free delivery unlocked!
                  </div>
                )}

                <div className="flex justify-between text-base font-extrabold text-[#0D2240] border-t border-slate-100 pt-3">
                  <span>To Pay</span>
                  <span className="text-lg">₹{grandTotal}</span>
                </div>
              </div>

              <button
                onClick={checkout}
                disabled={!restaurant.isOpen}
                className={`w-full rounded-2xl py-3.5 text-xs font-bold transition-all shadow-md ${
                  restaurant.isOpen
                    ? "bg-gradient-to-r from-[#0D2240] to-[#163A6B] text-white hover:from-[#09182E] hover:to-[#0F294D] shadow-[#0D2240]/20 cursor-pointer"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {!restaurant.isOpen ? "Restaurant Currently Closed" : "Proceed to Checkout →"}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <BiShield size={16} className="text-[#FB8C00]" />
                <span>Safe and Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
