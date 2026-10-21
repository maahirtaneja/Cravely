import { useEffect, useRef, useState } from "react";
import type { IOrder } from "../types";
import { useSocket } from "../context/SocketContext";
import audio from "../assets/restaurant-bell.mp3";
import axios from "axios";
import { restaurantService } from "../main";
import OrderCard from "./OrderCard";
import { BiBell } from "react-icons/bi";

const ACTIVE_STATUSES = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
];

const RestaurantOrders = ({ restaurantId }: { restaurantId: string }) => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const { socket } = useSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(audio);
    audioRef.current.load();
  }, []);

  const unlockAudio = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
          setAudioUnlocked(true);
        })
        .catch((err) => {
          console.log("Failed to unlock audio: ", err);
        });
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/order/restaurant/${restaurantId}`,
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
  }, [restaurantId]);

  useEffect(() => {
    if (!socket) return;

    const onNewOrder = () => {
      console.log("New order received socket");

      if (audioUnlocked && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.error("Audio play failed:", err);
        });
      }

      fetchOrders();
    };

    socket.on("order:new", onNewOrder);

    return () => {
      socket.off("order:new", onNewOrder);
    };
  }, [socket, audioUnlocked]);

  useEffect(() => {
    if (!socket) return;

    const onUpdateOrder = () => {
      fetchOrders();
    };

    socket.on("order:rider_assigned", onUpdateOrder);
    socket.on("order:update", onUpdateOrder);

    return () => {
      socket.off("order:rider_assigned", onUpdateOrder);
      socket.off("order:update", onUpdateOrder);
    };
  }, [socket]);

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const completedOrders = orders.filter(
    (o) => !ACTIVE_STATUSES.includes(o.status)
  );

  if (loading) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        Loading kitchen orders...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Audio permission banner */}
      {!audioUnlocked && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-3xl bg-amber-50/80 border border-amber-200/80 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#FB8C00] text-white shadow-xs">
              <BiBell size={20} />
            </div>
            <div>
              <p className="font-bold text-xs text-[#0D2240]">
                Enable Kitchen Order Chime
              </p>
              <p className="text-[11px] text-slate-500">
                Play an instant bell alert whenever customers place an order
              </p>
            </div>
          </div>

          <button
            onClick={unlockAudio}
            className="rounded-2xl bg-gradient-to-r from-[#0D2240] to-[#163A6B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:from-[#09182E] hover:to-[#0F294D] transition cursor-pointer"
          >
            Enable Sound
          </button>
        </div>
      )}

      {/* Active orders */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#0D2240] uppercase tracking-wider">
            Live Kitchen Orders
          </h3>
          {activeOrders.length > 0 && (
            <span className="rounded-full bg-amber-500/10 text-[#FB8C00] border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold">
              {activeOrders.length} active
            </span>
          )}
        </div>

        {activeOrders.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-xs text-slate-400 border border-slate-100">
            No active kitchen orders right now
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusUpdate={fetchOrders}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed orders */}
      <div className="space-y-3.5 pt-2">
        <h3 className="text-sm font-bold text-[#0D2240] uppercase tracking-wider">
          Completed Orders
        </h3>

        {completedOrders.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-xs text-slate-400 border border-slate-100">
            No completed orders yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusUpdate={fetchOrders}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantOrders;
