import { useState } from "react";
import type { IOrder } from "../types";
import { ORDER_ACTIONS } from "../utils/orderflow";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";

interface props {
  order: IOrder;
  onStatusUpdate?: () => void;
}

const statusColor = (status: string) => {
  switch (status) {
    case "placed":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "accepted":
      return "bg-orange-50 text-orange-800 border-orange-200";
    case "preparing":
      return "bg-sky-50 text-sky-800 border-sky-200";
    case "ready_for_rider":
      return "bg-indigo-50 text-indigo-800 border-indigo-200";
    case "rider_assigned":
      return "bg-blue-50 text-blue-800 border-blue-200";
    case "picked_up":
      return "bg-purple-50 text-purple-800 border-purple-200";
    case "delivered":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "cancelled":
      return "bg-rose-50 text-rose-800 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const OrderCard = ({ order, onStatusUpdate }: props) => {
  const [loading, setLoading] = useState(false);

  const actions = ORDER_ACTIONS[order.status] || [];
  const attempts = order.riderSearchAttempts || 1;

  const updateStatus = async (status: string) => {
    try {
      setLoading(true);
      const { data } = await axios.put(
        `${restaurantService}/api/order/${order._id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (data?.order?.status === "cancelled") {
        toast.error("5 retries reached: Order cancelled and refund initiated.");
      } else {
        toast.success(data?.message || "Order updated");
      }
      onStatusUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-xs font-bold text-[#0D2240] font-mono">
          Order #{order._id.slice(-6).toUpperCase()}
        </p>

        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold capitalize ${statusColor(
            order.status
          )}`}
        >
          {order.status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="text-xs text-slate-600 space-y-1">
        {order.items.map((item, i) => (
          <p key={i} className="flex justify-between">
            <span>{item.name}</span>
            <span className="font-bold text-slate-700">× {item.quauntity}</span>
          </p>
        ))}
      </div>

      <div className="flex justify-between text-xs font-bold text-[#0D2240] border-t border-slate-100 pt-2">
        <span>Order Amount</span>
        <span>₹{order.totalAmount}</span>
      </div>

      <p className="text-[10px] text-slate-400 capitalize">Payment Status: {order.paymentStatus}</p>

      {/* Cancelled Banner */}
      {order.status === "cancelled" && (
        <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
          <p className="font-bold">Cancelled (No Rider Found)</p>
          <p className="text-[11px] text-rose-600 mt-0.5 leading-relaxed">
            {order.cancelReason ||
              "5 retries exhausted without a rider. Customer refund of ₹" +
                order.totalAmount +
                " will be credited within 24 hours."}
          </p>
        </div>
      )}

      {/* Ready for Rider Search Status */}
      {order.status === "ready_for_rider" && (
        <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-900 font-bold">
            <span>Rider Matching in Progress</span>
            <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] text-amber-900 font-extrabold">
              Attempt {attempts} / 5
            </span>
          </div>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Click &quot;Retry Rider Search&quot; below if no rider accepted. After 5 retries, the order auto-cancels with a customer refund.
          </p>
        </div>
      )}

      {order.paymentStatus === "paid" &&
        order.status !== "cancelled" &&
        actions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {actions.map((status) => {
              const isRetry =
                order.status === "ready_for_rider" &&
                status === "ready_for_rider";
              return (
                <button
                  key={status}
                  disabled={loading}
                  onClick={() => updateStatus(status)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
                    isRetry
                      ? "bg-gradient-to-r from-[#FB8C00] to-[#F59E0B] hover:from-[#E67E00] hover:to-[#D97706] shadow-sm ring-2 ring-[#FB8C00]/30"
                      : "bg-gradient-to-r from-[#0D2240] to-[#163A6B] hover:from-[#09182E] hover:to-[#0F294D]"
                  }`}
                >
                  {isRetry
                    ? `🔄 Retry Rider Search (${attempts}/5)`
                    : `Mark as ${status.replaceAll("_", " ")}`}
                </button>
              );
            })}
          </div>
        )}
    </div>
  );
};

export default OrderCard;
