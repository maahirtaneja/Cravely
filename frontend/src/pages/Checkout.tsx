import { useEffect, useState } from "react";
import { useAppData } from "../context/AppContext";
import axios from "axios";
import { restaurantService, utilsService } from "../main";
import { useNavigate } from "react-router-dom";
import type { ICart, IMenuItem, IRestaurant } from "../types";
import toast from "react-hot-toast";
import { BiArrowBack, BiLoader, BiPlus, BiMapPin, BiShield } from "react-icons/bi";
import { SiRazorpay, SiStripe } from "react-icons/si";

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: number;
}

const Checkout = () => {
  const { cart, subTotal, quauntity } = useAppData();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setselectedAddressId] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);

  const [loadingRazorpay, setLoadingRazorpay] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!cart || cart.length === 0) {
        setLoadingAddress(false);
        return;
      }

      try {
        const { data } = await axios.get(
          `${restaurantService}/api/address/all`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setAddresses(data || []);
        if (data && data.length > 0 && !selectedAddressId) {
          setselectedAddressId(data[0]._id);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchAddresses();
  }, [cart]);

  const navigate = useNavigate();

  if (!cart || cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-3">
          <p className="text-slate-500 text-sm font-medium">Your cart is currently empty</p>
          <button
            onClick={() => navigate("/")}
            className="rounded-2xl bg-[#0D2240] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#163A6B] transition cursor-pointer"
          >
            Explore Restaurants
          </button>
        </div>
      </div>
    );
  }

  const restaurant = cart[0].restaurantId as IRestaurant;
  const deliveryFee = subTotal < 250 ? 49 : 0;
  const platformFee = 7;
  const grandTotal = subTotal + deliveryFee + platformFee;

  const createOrder = async (paymentMethod: "razorpay" | "stripe") => {
    if (!selectedAddressId) return null;

    setCreatingOrder(true);
    try {
      const { data } = await axios.post(
        `${restaurantService}/api/order/new`,
        {
          paymentMethod,
          addressId: selectedAddressId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      return data;
    } catch {
      toast.error("Failed to create Order");
    } finally {
      setCreatingOrder(false);
    }
  };

  const loadRazorpaySDK = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        return resolve(true);
      }
      const existingScript = document.getElementById("razorpay-sdk");
      if (existingScript) {
        existingScript.onload = () => resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const payWithRazorpay = async () => {
    try {
      setLoadingRazorpay(true);

      const order = await createOrder("razorpay");
      if (!order) return;

      const { orderId, amount } = order;

      const { data } = await axios.post(`${utilsService}/api/payment/create`, {
        orderId,
      });

      const { razorpayOrderId, key } = data;

      const sdkReady = await loadRazorpaySDK();
      if (!sdkReady || !(window as any).Razorpay) {
        toast.error("Failed to load Razorpay SDK. Please check your network.");
        return;
      }

      const options = {
        key,
        amount: amount * 100,
        currency: "INR",
        name: "Cravely",
        description: "Food Order Payment",
        order_id: razorpayOrderId,

        handler: async (response: any) => {
          try {
            await axios.post(`${utilsService}/api/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });

            toast.success("Payment successful 🎉");
            navigate("/paymentsuccess/" + response.razorpay_payment_id);
          } catch (error: any) {
            toast.error(
              error?.response?.data?.message || "Payment verification failed"
            );
          }
        },
        theme: {
          color: "#0D2240",
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on("payment.failed", (response: any) => {
        toast.error(response.error?.description || "Payment was cancelled or failed");
      });
      razorpay.open();
    } catch (error: any) {
      console.log(error);
      toast.error(
        error?.response?.data?.message || "Payment initiation failed"
      );
    } finally {
      setLoadingRazorpay(false);
    }
  };

  const payWithStripe = async () => {
    try {
      setLoadingStripe(true);
      const order = await createOrder("stripe");
      if (!order) return;

      const { orderId } = order;

      const { data } = await axios.post(
        `${utilsService}/api/payment/stripe/create`,
        {
          orderId,
        }
      );

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.message || "Failed to create Stripe payment session");
      }
    } catch (error: any) {
      console.log(error);
      toast.error(
        error?.response?.data?.message || "Stripe payment failed"
      );
    } finally {
      setLoadingStripe(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <button
          onClick={() => navigate("/cart")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0D2240] transition cursor-pointer"
        >
          <BiArrowBack size={16} />
          Back to Cart
        </button>

        <h1 className="text-2xl font-extrabold text-[#0D2240]">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Delivery Address + Order Summary (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Restaurant Info */}
            <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FB8C00]">
                    Fulfilling Kitchen
                  </p>
                  <h2 className="text-lg font-extrabold text-[#0D2240]">
                    {restaurant.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {restaurant.autoLocation?.formattedAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Address Section */}
            <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BiMapPin className="text-[#FB8C00]" size={18} />
                  <h3 className="font-bold text-sm text-[#0D2240]">
                    Select Delivery Address
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/address")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#FB8C00] hover:underline cursor-pointer"
                >
                  <BiPlus size={16} />
                  Add New
                </button>
              </div>

              {loadingAddress ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <BiLoader className="animate-spin" size={16} />
                  Loading saved addresses...
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-xs text-slate-500">
                    No delivery address saved yet. Please add an address to complete your order.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/address")}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0D2240] to-[#163A6B] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:from-[#09182E] hover:to-[#0F294D] transition cursor-pointer"
                  >
                    <BiPlus size={16} />
                    Add Address Now
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {addresses.map((add) => {
                    const isSelected = selectedAddressId === add._id;
                    return (
                      <label
                        key={add._id}
                        className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "border-[#FB8C00] bg-amber-50/40 ring-2 ring-[#FB8C00]/20"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery_address"
                          checked={isSelected}
                          onChange={() => setselectedAddressId(add._id)}
                          className="mt-1 accent-[#FB8C00]"
                        />
                        <div className="flex-1 text-xs">
                          <p className="font-semibold text-slate-800 leading-relaxed">
                            {add.formattedAddress}
                          </p>
                          <p className="text-slate-400 mt-1 font-mono">
                            📞 Phone: {add.mobile}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ordered Items Preview */}
            <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-[#0D2240] border-b border-slate-100 pb-3">
                Order Review ({quauntity} items)
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {cart.map((cartItem: ICart) => {
                  const item = cartItem.itemId as IMenuItem;
                  return (
                    <div
                      className="flex justify-between py-2.5 first:pt-0 last:pb-0"
                      key={cartItem._id}
                    >
                      <span className="text-slate-700">
                        {item.name} <strong className="text-[#FB8C00]">× {cartItem.quauntity}</strong>
                      </span>
                      <span className="font-bold text-[#0D2240]">
                        ₹{item.price * cartItem.quauntity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Bill Details & Payment Options (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-[#0D2240]">
                Payment Breakdown
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Items Total</span>
                  <span className="font-semibold text-slate-800">₹{subTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
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
                  <span className="font-semibold text-slate-800">₹{platformFee}</span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-[#0D2240] border-t border-slate-100 pt-3">
                  <span>Amount to Pay</span>
                  <span className="text-lg">₹{grandTotal}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="pt-2 space-y-2.5">
                <p className="text-xs font-bold text-slate-700">
                  Select Payment Method
                </p>

                {/* Razorpay Button */}
                <button
                  disabled={!selectedAddressId || loadingRazorpay || creatingOrder}
                  onClick={payWithRazorpay}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0D2240] to-[#163A6B] py-3.5 text-xs font-bold text-white shadow-md shadow-[#0D2240]/20 hover:from-[#09182E] hover:to-[#0F294D] transition-all cursor-pointer disabled:opacity-50"
                >
                  {loadingRazorpay ? (
                    <BiLoader size={16} className="animate-spin" />
                  ) : (
                    <SiRazorpay size={16} className="text-[#FB8C00]" />
                  )}
                  Pay with Razorpay (UPI, Cards, Netbanking)
                </button>

                {/* Stripe Button */}
                <button
                  disabled={!selectedAddressId || loadingStripe || creatingOrder}
                  onClick={payWithStripe}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loadingStripe ? (
                    <BiLoader size={16} className="animate-spin" />
                  ) : (
                    <SiStripe size={18} className="text-[#635BFF]" />
                  )}
                  Pay with Stripe (International / Cards)
                </button>
              </div>

              {!selectedAddressId && (
                <p className="text-[11px] text-amber-700 text-center bg-amber-50 rounded-xl p-2 font-medium">
                  ⚠️ Please select or add a delivery address to pay
                </p>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <BiShield size={16} className="text-[#FB8C00]" />
                <span>256-bit Bank-grade Encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
