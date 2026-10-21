import { useEffect, useState } from "react";
import type { IOrder } from "../types";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { restaurantService } from "../main";
import { BiArrowBack, BiChevronRight, BiPackage } from "react-icons/bi";

const ACTIVE_STATUSES = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
];

const Orders = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/order/myorder`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setOrders(data.orders || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onOrderUpdate = () => {
      fetchOrders();
    };

    socket.on("order:update", onOrderUpdate);
    socket.on("order:rider_assigned", onOrderUpdate);

    return () => {
      socket.off("order:update", onOrderUpdate);
      socket.off("order:rider_assigned", onOrderUpdate);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#FB8C00] border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col min-h-[75vh] items-center justify-center px-4 text-center space-y-5 bg-[#F8FAFC]">
        <div className="h-20 w-20 rounded-3xl bg-amber-50 text-[#FB8C00] flex items-center justify-center shadow-inner">
          <BiPackage size={40} />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h2 className="text-2xl font-extrabold text-[#0D2240]">No Orders Yet</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Looks like you haven't placed any orders yet. Discover delicious food from restaurants near you!
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

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const completedOrders = orders.filter(
    (o) => !ACTIVE_STATUSES.includes(o.status)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0D2240] transition cursor-pointer"
          >
            <BiArrowBack size={16} />
            Back to Home
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-[#0D2240]">My Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track your live meal deliveries & past cravings</p>
        </div>

        {/* Active Orders */}
        <section className="space-y-3.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Live & Active Orders
            </h2>
            {activeOrders.length > 0 && (
              <span className="rounded-full bg-amber-500/10 text-[#FB8C00] border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold">
                {activeOrders.length} active
              </span>
            )}
          </div>

          {activeOrders.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center text-xs text-slate-400 border border-slate-100 shadow-sm">
              No orders are currently in progress
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <OrderRow
                  key={order._id}
                  order={order}
                  onClick={() => navigate(`/order/${order._id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Completed Orders */}
        <section className="space-y-3.5 pt-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Past Deliveries
          </h2>

          {completedOrders.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center text-xs text-slate-400 border border-slate-100 shadow-sm">
              No completed orders yet
            </div>
          ) : (
            <div className="space-y-3">
              {completedOrders.map((order) => (
                <OrderRow
                  key={order._id}
                  order={order}
                  onClick={() => navigate(`/order/${order._id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Orders;

// Clean Modern Order Row
const OrderRow = ({
  order,
  onClick,
}: {
  order: IOrder;
  onClick: () => void;
}) => {
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "placed":
      case "accepted":
      case "preparing":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "ready_for_rider":
      case "rider_assigned":
      case "picked_up":
        return "bg-sky-50 text-sky-800 border-sky-200";
      case "delivered":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "cancelled":
        return "bg-rose-50 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div
      className="group cursor-pointer rounded-3xl bg-white p-5 border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-200 transition-all duration-200"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-base text-[#0D2240] group-hover:text-[#FB8C00] transition-colors">
            {order.restaurantName || `Order #${order._id.slice(-6)}`}
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Order #{order._id.slice(-6).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getBadgeStyle(
              order.status
            )}`}
          >
            {order.status.replaceAll("_", " ")}
          </span>
          <BiChevronRight className="text-slate-400 group-hover:text-[#FB8C00] group-hover:translate-x-0.5 transition-all" size={20} />
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-600 line-clamp-1">
        {order.items.map((item, i) => (
          <span key={i}>
            {item.name} × <strong>{item.quauntity}</strong>
            {i < order.items.length - 1 && " • "}
          </span>
        ))}
      </div>

      <div className="mt-4 flex justify-between items-center text-xs border-t border-slate-100 pt-3">
        <span className="text-slate-400 capitalize">
          {order.paymentMethod} • <span className="font-semibold text-slate-600">{order.paymentStatus}</span>
        </span>
        <span className="font-extrabold text-sm text-[#0D2240]">₹{order.totalAmount}</span>
      </div>
    </div>
  );
};
