import { useNavigate, useParams } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useEffect } from "react";
import { BiCheckCircle } from "react-icons/bi";
import { BsArrowRight } from "react-icons/bs";

const PaymentSuccess = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();

  const { fetchCart } = useAppData();

  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-8 bg-[#F8FAFC]">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm border border-slate-100 text-center space-y-5">
        <div className="h-20 w-20 rounded-3xl bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center shadow-inner">
          <BiCheckCircle size={56} />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-[#0D2240]">
            Payment Successful!
          </h1>
          <p className="text-xs text-slate-500">
            Your delicious cravings are now confirmed and sent to the kitchen 🎉
          </p>
        </div>

        {paymentId && (
          <div className="rounded-2xl bg-slate-50 p-3.5 text-left border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Payment Transaction ID
            </span>
            <p className="font-mono text-xs text-slate-700 break-all mt-0.5">
              {paymentId}
            </p>
          </div>
        )}

        <div className="space-y-2.5 pt-2">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0D2240] to-[#163A6B] py-3.5 text-xs font-bold text-white shadow-md shadow-[#0D2240]/20 hover:from-[#09182E] hover:to-[#0F294D] transition-all cursor-pointer"
            onClick={() => navigate("/orders")}
          >
            Track Your Order Live <BsArrowRight size={15} />
          </button>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            onClick={() => navigate("/")}
          >
            Discover More Restaurants
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
