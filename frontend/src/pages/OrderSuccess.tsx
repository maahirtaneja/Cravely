import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { utilsService } from "../main";
import toast from "react-hot-toast";
import { useAppData } from "../context/AppContext";
import { BiCheckCircle } from "react-icons/bi";
import { BsArrowRight } from "react-icons/bs";

const OrderSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { fetchCart } = useAppData();
  const [verifying, setVerifying] = useState(true);

  const sessionId = params.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setVerifying(false);
        return;
      }

      try {
        await axios.post(`${utilsService}/api/payment/stripe/verify`, {
          sessionId,
        });

        toast.success("Payment verified successfully 🎉");
        await fetchCart();
      } catch (error) {
        toast.error("Stripe verification failed or already processed");
        console.log(error);
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-8 bg-[#F8FAFC]">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm text-center space-y-5 border border-slate-100">
        <div className="h-20 w-20 rounded-3xl bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center shadow-inner">
          <BiCheckCircle size={56} />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-[#0D2240]">
            Payment Successful!
          </h1>
          <p className="text-xs text-slate-500">
            {verifying
              ? "Confirming Stripe transaction..."
              : "Your food order has been placed and sent to the kitchen 🎉"}
          </p>
        </div>

        {sessionId && (
          <div className="rounded-2xl bg-slate-50 p-3.5 text-left border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Stripe Session Reference
            </span>
            <p className="font-mono text-xs text-slate-700 break-all mt-0.5">
              {sessionId}
            </p>
          </div>
        )}

        <div className="space-y-2.5 pt-2">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0D2240] to-[#163A6B] py-3.5 text-xs font-bold text-white shadow-md shadow-[#0D2240]/20 hover:from-[#09182E] hover:to-[#0F294D] transition-all cursor-pointer"
            onClick={() => navigate("/orders")}
          >
            Track Your Orders Live <BsArrowRight size={15} />
          </button>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            onClick={() => navigate("/")}
          >
            Explore More Cravings
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
