import axios from "axios";
import { useEffect, useState } from "react";
import { adminService } from "../main";
import AdminRestaurantCard from "../components/AdminRestaurantCard";
import RiderAdmin from "../components/RiderAdmin";
import ProfileDropdown from "../components/ProfileDropdown";
import { BiCheckCircle, BiShield } from "react-icons/bi";

const Admin = () => {
  const [restaurant, setRestaurant] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"restaurant" | "rider">("restaurant");

  const fetchData = async () => {
    try {
      const { data } = await axios.get(
        `${adminService}/api/v1/admin/restaurant/pending`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const response = await axios.get(
        `${adminService}/api/v1/admin/rider/pending`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setRestaurant(data.restaurants || []);
      setRiders(response.data.riders || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#FB8C00] border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* Top Bar for Admin */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-xs sticky top-0 z-30">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo-icon.png" alt="Cravely" className="h-7 w-auto object-contain" />
            <div className="flex flex-col justify-center">
              <span className="text-lg font-extrabold text-[#0D2240] leading-none">
                Cravel<span className="text-[#FB8C00]">y</span>
              </span>
              <span className="text-[9px] font-mono font-medium text-slate-400 tracking-tight leading-none mt-1">
                &lt;developed by Maahir Taneja /&gt;
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0D2240] border border-slate-200">
              <BiShield size={13} className="text-[#FB8C00]" />
              Super Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ProfileDropdown />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0D2240]">Verification & Approvals</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and approve pending restaurant partners and delivery riders
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2.5 border-b border-slate-200 pb-3">
          <button
            onClick={() => setTab("restaurant")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
              tab === "restaurant"
                ? "bg-gradient-to-r from-[#0D2240] to-[#163A6B] text-white shadow-md shadow-[#0D2240]/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Pending Restaurants
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                tab === "restaurant"
                  ? "bg-amber-400 text-[#0D2240]"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {restaurant.length}
            </span>
          </button>

          <button
            onClick={() => setTab("rider")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
              tab === "rider"
                ? "bg-gradient-to-r from-[#0D2240] to-[#163A6B] text-white shadow-md shadow-[#0D2240]/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Pending Riders
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                tab === "rider"
                  ? "bg-amber-400 text-[#0D2240]"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {riders.length}
            </span>
          </button>
        </div>

        {/* Content */}
        {tab === "restaurant" && (
          <div>
            {restaurant.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl shadow-xs border border-slate-100 space-y-2">
                <BiCheckCircle size={44} className="mx-auto text-emerald-500" />
                <h3 className="font-bold text-sm text-[#0D2240]">All Restaurants Reviewed!</h3>
                <p className="text-xs text-slate-400">
                  There are no pending restaurant partners waiting for verification.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {restaurant.map((res) => (
                  <AdminRestaurantCard
                    key={res._id}
                    restaurant={res}
                    onVerify={fetchData}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "rider" && (
          <div>
            {riders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl shadow-xs border border-slate-100 space-y-2">
                <BiCheckCircle size={44} className="mx-auto text-emerald-500" />
                <h3 className="font-bold text-sm text-[#0D2240]">All Riders Verified!</h3>
                <p className="text-xs text-slate-400">
                  There are no pending rider applications waiting for approval.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {riders.map((r) => (
                  <RiderAdmin key={r._id} rider={r} onVerify={fetchData} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
