import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useEffect, useState } from "react";
import type { IOrder } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import UserOrderMap from "../components/UserOrderMap";
import { BiArrowBack, BiPhoneCall, BiShield } from "react-icons/bi";
import toast from "react-hot-toast";

const OrderPage = () => {
  const { id } = useParams();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const { data } = await axios.get(`${restaurantService}/api/order/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setOrder(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    const onOrderUpdate = (data?: any) => {
      if (data?.status === "cancelled" || data?.cancelReason) {
        toast.error(
          data?.cancelReason ||
            "Rider not available. Order cancelled. Refund will be credited within 24 hours.",
          { duration: 7000 }
        );
      }
      fetchOrder();
    };

    socket.on("order:update", onOrderUpdate);
    socket.on("order:rider_assigned", onOrderUpdate);

    return () => {
      socket.off("order:update", onOrderUpdate);
      socket.off("order:rider_assigned", onOrderUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("join", `user:${id}`);

    return () => {
      socket.emit("leave", `user:${id}`);
    };
  }, [socket, id]);

  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(
    null
  );

  useEffect(() => {
    if (!socket) return;

    const onRiderLocation = ({ latitude, longitude }: any) => {
      console.log("Rider Location:", latitude, longitude);
      setRiderLocation([latitude, longitude]);
    };

    socket.on("rider:location", onRiderLocation);

    return () => {
      socket.off("rider:location", onRiderLocation);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#FB8C00] border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Tracking your order live...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col min-h-[60vh] items-center justify-center space-y-4 px-4 text-center bg-[#F8FAFC]">
        <p className="text-sm font-semibold text-slate-600">Order not found</p>
        <button
          onClick={() => navigate("/orders")}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0D2240] to-[#163A6B] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:from-[#09182E] hover:to-[#0F294D] transition cursor-pointer"
        >
          <BiArrowBack size={16} />
          View All Orders
        </button>
      </div>
    );
  }

  const formattedAddress =
    order.deliveryAddress?.fromattedAddress ||
    (order.deliveryAddress as any)?.formattedAddress ||
    "Delivery address";

  const getStatusColor = (status: string) => {
    if (status === "cancelled") return "bg-rose-50 text-rose-700 border-rose-200";
    if (status === "delivered") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    return "bg-amber-50 text-amber-800 border-amber-200";
  };

  const isUrl = (str?: string | null) =>
    Boolean(str && (str.startsWith("http://") || str.startsWith("https://")));
  const riderPhoto =
    order.riderImage || (isUrl(order.riderName) ? order.riderName : null);
  const displayName = isUrl(order.riderName)
    ? "Delivery Partner"
    : order.riderName || "Delivery Partner";

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Back navigation button */}
        <button
          onClick={() => navigate("/orders")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0D2240] transition cursor-pointer"
        >
          <BiArrowBack size={16} />
          Back to Orders
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0D2240]">
              Order #{order._id.slice(-6).toUpperCase()}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span
            className={`rounded-full border px-3.5 py-1 text-xs font-bold capitalize ${getStatusColor(
              order.status
            )}`}
          >
            {order.status.replaceAll("_", " ")}
          </span>
        </div>

        {/* Cancellation & Refund Alert */}
        {order.status === "cancelled" && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-5 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-200 text-rose-700 text-xs font-black">
                ✕
              </span>
              Order Cancelled — Delivery Partner Unavailable
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">
              {order.cancelReason ||
                `Rider not available. Your order has been cancelled and a full refund of ₹${order.totalAmount} will be credited to your original payment method within 24 hours.`}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-semibold text-rose-600 border-t border-rose-200/70">
              <span>💳 Refund Amount: ₹{order.totalAmount}</span>
              <span>•</span>
              <span>Mode: {order.paymentMethod?.toUpperCase()}</span>
              <span>•</span>
              <span>Timeline: Within 24 Hours</span>
            </div>
          </div>
        )}

        {/* Rider Search in Progress Banner */}
        {order.status === "ready_for_rider" && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4 flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#FB8C00] border-t-transparent shrink-0" />
            <div className="text-xs text-amber-900">
              <p className="font-bold">Connecting with nearby Cravely delivery partners...</p>
              <p className="text-amber-700 mt-0.5 leading-relaxed">
                Checking for available riders up to 5 times. If no delivery partner is nearby, the order will automatically cancel and refund within 24 hours.
              </p>
            </div>
          </div>
        )}

        {/* Assigned Rider Info if available */}
        {(order.riderName || order.riderId || order.riderImage) && (
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {riderPhoto ? (
                <img
                  src={riderPhoto}
                  alt="Delivery Partner"
                  className="h-11 w-11 rounded-2xl object-cover border border-slate-100 shadow-2xs"
                />
              ) : (
                <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-lg">
                  🛵
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                  Assigned Delivery Partner
                </p>
                <p className="font-bold text-sm text-[#0D2240]">{displayName}</p>
              </div>
            </div>
            {order.riderPhone && (
              <a
                href={`tel:${order.riderPhone}`}
                className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 text-white font-bold px-3.5 py-2 rounded-xl hover:bg-emerald-700 transition shadow-xs"
              >
                <BiPhoneCall size={14} />
                Call Rider
              </a>
            )}
          </div>
        )}

        {/* Items Ordered */}
        <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-3">
          <h2 className="font-bold text-sm text-[#0D2240] border-b border-slate-100 pb-3">
            Items Ordered
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            {order.items.map((item, i) => (
              <div className="flex justify-between py-2.5 first:pt-0 last:pb-0" key={i}>
                <span className="text-slate-700 font-medium">
                  {item.name} <span className="text-[#FB8C00] font-bold">× {item.quauntity}</span>
                </span>
                <span className="font-bold text-[#0D2240]">
                  ₹{item.price * item.quauntity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-2">
          <h2 className="font-bold text-sm text-[#0D2240] border-b border-slate-100 pb-3">
            Delivery Location
          </h2>
          <p className="text-xs text-slate-600 pt-1 leading-relaxed">{formattedAddress}</p>
          <p className="text-[11px] text-slate-400 font-mono">
            Contact: {order.deliveryAddress?.mobile}
          </p>
        </div>

        {/* Payment Summary */}
        <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-2.5">
          <h2 className="font-bold text-sm text-[#0D2240] border-b border-slate-100 pb-3">
            Payment Summary
          </h2>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span> <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span> <span>₹{order.deliveryFee}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee</span> <span>₹{order.platfromFee}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-[#0D2240] border-t border-slate-100 pt-2.5">
              <span>Total Paid</span> <span>₹{order.totalAmount}</span>
            </div>
          </div>

          <div className="flex justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-100">
            <span>Method: <strong className="capitalize text-slate-600">{order.paymentMethod}</strong></span>
            <span>Status: <strong className="capitalize text-emerald-600">{order.paymentStatus}</strong></span>
          </div>
        </div>

        {/* Live Rider GPS Map */}
        {(order.status === "rider_assigned" || order.status === "picked_up") &&
          (riderLocation ? (
            <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-sm overflow-hidden space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-bold text-sm text-[#0D2240]">Live GPS Partner Tracking</h3>
              </div>
              <UserOrderMap
                riderLocation={riderLocation}
                deliveryLocation={[
                  order.deliveryAddress.latitude!,
                  order.deliveryAddress.longitude!,
                ]}
              />
            </div>
          ) : (
            <div className="rounded-3xl bg-amber-50/70 border border-amber-200 p-4 text-center text-xs text-amber-900 font-medium">
              Delivery partner is heading your way. Connecting to live satellite location...
            </div>
          ))}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2 pb-6">
          <BiShield size={16} className="text-[#FB8C00]" />
          <span>Cravely Safe Delivery Guarantee</span>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
