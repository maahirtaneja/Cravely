import { useEffect, useState } from "react";
import { useAppData } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authService } from "../main";
import toast from "react-hot-toast";
import { BiArrowBack, BiLogOut } from "react-icons/bi";

type Role = "customer" | "rider" | "seller" | null;

const SelectRole = () => {
  const { user, setUser, setIsAuth } = useAppData();
  const [role, setRole] = useState<Role>((user?.role as Role) || null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const isAdminUser =
    Boolean(user?.isAdmin) ||
    user?.email === "admin@cravely.internal" ||
    user?.role === "admin";

  useEffect(() => {
    // Only administrators can switch roles once a role is set
    if (user?.role && !isAdminUser) {
      toast("Role switching is reserved for administrators.", {
        icon: "🔒",
      });
      navigate("/", { replace: true });
    }
  }, [user, navigate, isAdminUser]);

  const roles: { id: "customer" | "rider" | "seller"; label: string; desc: string }[] = [
    {
      id: "customer",
      label: "Customer",
      desc: "Order delicious food from top restaurants near you",
    },
    {
      id: "seller",
      label: "Restaurant Owner (Seller)",
      desc: "List your restaurant, manage menus, and accept orders",
    },
    {
      id: "rider",
      label: "Delivery Partner (Rider)",
      desc: "Deliver orders, earn on every trip, and manage deliveries",
    },
  ];

  const logoutHandler = () => {
    localStorage.setItem("token", "");
    setUser(null);
    setIsAuth(false);
    navigate("/login");
    toast.success("Logged out");
  };

  const addRole = async () => {
    if (!role) return;

    try {
      setSubmitting(true);
      const { data } = await axios.put(
        `${authService}/api/auth/add/role`,
        { role },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      localStorage.setItem("token", data.token);
      setUser(data.user);
      toast.success(`Role set to ${role}! 🎉`);
      navigate("/", { replace: true });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-8">
      {/* Background ambient decorative blurs */}
      <div className="absolute top-[-10%] right-[-10%] h-96 w-96 rounded-full bg-[#FB8C00]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] h-96 w-96 rounded-full bg-[#0D2240]/5 blur-3xl pointer-events-none" />

      {/* Top action buttons */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between max-w-xl mx-auto">
        {user?.role ? (
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#0D2240] font-semibold transition"
          >
            <BiArrowBack size={16} />
            Back to App
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={logoutHandler}
            className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-medium transition cursor-pointer"
          >
            <BiLogOut size={14} />
            Logout
          </button>
        </div>
      </div>

      <div className="w-full max-w-md flex flex-col items-center gap-4">
        <div className="w-full rounded-3xl bg-white p-7 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/logo-icon.png"
            alt="Cravely"
            className="h-12 w-auto mx-auto object-contain hover:scale-105 transition-transform duration-300"
          />
          <h1 className="text-2xl font-extrabold text-[#0D2240]">
            {user?.role ? "Switch Your Role" : "Choose Your Cravely Role"}
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Select how you would like to experience Cravely
          </p>
        </div>

        <div className="space-y-3">
          {roles.map((r) => {
            const isSelected = role === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-[#FB8C00] bg-amber-50/40 shadow-sm ring-2 ring-[#FB8C00]/30"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold text-sm ${isSelected ? "text-[#0D2240]" : "text-slate-800"}`}>
                    {r.label}
                  </span>
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center transition ${
                      isSelected
                        ? "border-[#FB8C00] bg-[#FB8C00]"
                        : "border-slate-300"
                    }`}
                  >
                    {isSelected && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">{r.desc}</p>
              </button>
            );
          })}
        </div>

        <button
          disabled={!role || submitting}
          onClick={addRole}
          className={`w-full rounded-2xl py-3.5 text-sm font-semibold transition-all ${
            role && !submitting
              ? "bg-gradient-to-r from-[#0D2240] to-[#163A6B] text-white hover:from-[#09182E] hover:to-[#0F294D] shadow-md shadow-[#0D2240]/20 cursor-pointer"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {submitting ? "Saving..." : user?.role ? "Switch Role" : "Continue"}
        </button>
        </div>

        <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3.5 py-1 text-[11px] font-mono font-medium text-slate-500 shadow-2xs">
          &lt;developed by Maahir Taneja /&gt;
        </span>
      </div>
    </div>
  );
};

export default SelectRole;
