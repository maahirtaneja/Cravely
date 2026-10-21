import { useEffect, useState } from "react";
import { riderService } from "../main";
import axios from "axios";
import toast from "react-hot-toast";

interface Props {
  orderId: string;
  onAccepting?: () => void;
  onAccepted: () => void;
  onDismiss: () => void;
}

const RiderOrderRequest = ({
  orderId,
  onAccepting,
  onAccepted,
  onDismiss,
}: Props) => {
  const [accepting, setAccepting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [alreadyTaken, setAlreadyTaken] = useState(false);

  useEffect(() => {
    if (alreadyTaken) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [alreadyTaken, onDismiss]);

  const acceptOrder = async () => {
    if (accepting || alreadyTaken) return;

    onAccepting?.(); // Instantly mute/cut off the notification audio on click
    setAccepting(true);
    try {
      await axios.post(
        `${riderService}/api/rider/accept/${orderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success("Order Accepted! 🎉");
      onAccepted();
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message ||
        "Order was already accepted by another rider";

      setAlreadyTaken(true);
      toast.error(errMsg, { icon: "🛵", duration: 4000 });

      // Clean up the card gracefully after showing status
      setTimeout(() => {
        onDismiss();
      }, 1500);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div
      className={`rounded-2xl p-4 shadow-sm border transition-all space-y-3 ${
        alreadyTaken
          ? "bg-rose-50/70 border-rose-200"
          : "bg-white border-amber-300 ring-2 ring-amber-400/20 shadow-md"
      }`}
    >
      <div className="flex items-center justify-between text-xs font-bold">
        <span className={alreadyTaken ? "text-rose-700" : "text-emerald-700"}>
          {alreadyTaken ? "⚠️ Order Claimed by Other Rider" : "⚡ New Delivery Request"}
        </span>
        {!alreadyTaken && (
          <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[11px] font-mono font-extrabold animate-pulse">
            {secondsLeft}s left
          </span>
        )}
      </div>

      <p className="text-xs text-slate-600 font-mono">
        Order ID: <b>#{orderId.slice(-6).toUpperCase()}</b>
      </p>

      {alreadyTaken ? (
        <div className="rounded-xl bg-rose-100/80 py-2.5 px-3 text-center text-xs font-semibold text-rose-800">
          This order was already accepted by another delivery partner!
        </div>
      ) : (
        <button
          disabled={accepting}
          onClick={acceptOrder}
          className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 shadow-sm disabled:opacity-50 transition cursor-pointer"
        >
          {accepting ? "Securing Delivery..." : "Accept Delivery Partner Request"}
        </button>
      )}
    </div>
  );
};

export default RiderOrderRequest;
