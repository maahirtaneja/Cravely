import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import toast from "react-hot-toast";
import {
  BiArrowBack,
  BiEditAlt,
  BiLogOut,
  BiMapPin,
  BiPackage,
  BiTransfer,
} from "react-icons/bi";
import EditProfileModal from "../components/EditProfileModal";

const Account = () => {
  const { user, setUser, setIsAuth } = useAppData();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const firstLetter = user?.name?.charAt(0)?.toUpperCase() || "U";
  const navigate = useNavigate();

  const canSwitchRole =
    Boolean(user?.isAdmin) ||
    user?.email === "admin@cravely.internal" ||
    user?.role === "admin";

  const logoutHandler = () => {
    localStorage.setItem("token", "");
    setUser(null);
    setIsAuth(false);
    navigate("/login");
    toast.success("Logged out successfully");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
      <div className="mx-auto max-w-md space-y-5">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0D2240] transition cursor-pointer"
        >
          <BiArrowBack size={16} />
          Back to Home
        </button>

        <div className="rounded-3xl bg-white shadow-sm border border-slate-100 overflow-hidden">
          {/* User Profile Header */}
          <div className="flex items-center gap-4 border-b border-slate-100 p-6 bg-gradient-to-br from-slate-50/50 to-white">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="h-16 w-16 rounded-2xl object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0D2240] to-[#163A6B] text-2xl font-black text-white shadow-md shadow-[#0D2240]/20">
                {firstLetter}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-extrabold text-[#0D2240] truncate">
                {user?.name}
              </h2>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="inline-block rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FB8C00]">
                  {user?.role || "Customer"}
                </span>
                {canSwitchRole && (
                  <span className="inline-block rounded-full bg-[#0D2240]/10 border border-[#0D2240]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0D2240]">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="divide-y divide-slate-100 text-slate-700">
            <div
              className="flex cursor-pointer items-center gap-4 p-5 hover:bg-slate-50 transition"
              onClick={() => setIsEditOpen(true)}
            >
              <div className="p-2 rounded-xl bg-slate-100 text-[#0D2240]">
                <BiEditAlt size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#0D2240]">
                    Edit Profile
                  </span>
                  {canSwitchRole && (
                    <span className="text-[10px] font-mono text-slate-400">
                      (Admin Immutable)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {canSwitchRole
                    ? "View account info and administrative credentials"
                    : "Update your name or manage account deletion"}
                </p>
              </div>
            </div>

            <div
              className="flex cursor-pointer items-center gap-4 p-5 hover:bg-slate-50 transition"
              onClick={() => navigate("/orders")}
            >
              <div className="p-2 rounded-xl bg-amber-50 text-[#FB8C00]">
                <BiPackage size={20} />
              </div>
              <div className="flex-1">
                <span className="font-bold text-sm text-[#0D2240]">Your Orders</span>
                <p className="text-xs text-slate-400">Track active and past deliveries</p>
              </div>
            </div>

            <div
              className="flex cursor-pointer items-center gap-4 p-5 hover:bg-slate-50 transition"
              onClick={() => navigate("/address")}
            >
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <BiMapPin size={20} />
              </div>
              <div className="flex-1">
                <span className="font-bold text-sm text-[#0D2240]">Saved Addresses</span>
                <p className="text-xs text-slate-400">Manage your delivery locations</p>
              </div>
            </div>

            {canSwitchRole && (
              <div
                className="flex cursor-pointer items-center gap-4 p-5 hover:bg-slate-50 transition"
                onClick={() => navigate("/select-role")}
              >
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <BiTransfer size={20} />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-sm text-[#0D2240]">Switch Role</span>
                  <p className="text-xs text-slate-400">Switch between Customer, Seller, or Rider</p>
                </div>
              </div>
            )}

            <div
              className="flex cursor-pointer items-center gap-4 p-5 hover:bg-rose-50 text-rose-600 transition"
              onClick={logoutHandler}
            >
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <BiLogOut size={20} />
              </div>
              <span className="font-bold text-sm">Logout</span>
            </div>
          </div>
        </div>

        {/* Developer Credit */}
        <div className="flex justify-center pt-2">
          <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3.5 py-1 text-[11px] font-mono font-medium text-slate-500 shadow-2xs">
            &lt;developed by Maahir Taneja /&gt;
          </span>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </div>
  );
};

export default Account;
