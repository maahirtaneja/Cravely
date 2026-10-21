import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import axios from "axios";
import { authService } from "../main";
import toast from "react-hot-toast";
import {
  BiCheckCircle,
  BiLockAlt,
  BiShield,
  BiTransfer,
  BiX,
} from "react-icons/bi";

interface SwitchRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RoleType = "customer" | "rider" | "seller" | "admin";

const SwitchRoleModal = ({ isOpen, onClose }: SwitchRoleModalProps) => {
  const { user, setUser } = useAppData();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<RoleType>(
    (user?.role as RoleType) || "customer"
  );
  const [submitting, setSubmitting] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [showAdminPasswordInput, setShowAdminPasswordInput] = useState(false);

  const isAdminUser =
    Boolean(user?.isAdmin) ||
    user?.email === "admin@cravely.internal" ||
    user?.role === "admin";

  if (!isOpen || !user || !isAdminUser) return null;
  if (typeof document === "undefined") return null;

  const roles: {
    id: RoleType;
    label: string;
    desc: string;
    badge: string;
    icon: string;
  }[] = [
    {
      id: "customer",
      label: "Customer",
      desc: "Order delicious food, browse menus & track deliveries",
      badge: "Consumer",
      icon: "👤",
    },
    {
      id: "seller",
      label: "Restaurant Owner",
      desc: "Manage Kitchen Console, food items, and live kitchen orders",
      badge: "Partner",
      icon: "🍳",
    },
    {
      id: "rider",
      label: "Delivery Partner",
      desc: "Accept incoming order alerts, deliver food, and earn",
      badge: "Fleet",
      icon: "🛵",
    },
    {
      id: "admin",
      label: "Platform Administrator",
      desc: "Review verifications, manage approvals, and supervise systems",
      badge: "Super Admin",
      icon: "🛡️",
    },
  ];

  const handleRoleSelection = (roleId: RoleType) => {
    setSelectedRole(roleId);
    setAdminError("");
    if (roleId === "admin" && !isAdminUser) {
      setShowAdminPasswordInput(true);
    } else {
      setShowAdminPasswordInput(false);
    }
  };

  const handleSwitch = async () => {
    // If switching to admin and not already admin, verify password
    if (selectedRole === "admin" && !isAdminUser) {
      if (!adminPassword.trim()) {
        setAdminError("Please enter the administrator password");
        return;
      }

      try {
        setSubmitting(true);
        setAdminError("");
        const { data } = await axios.post(
          `${authService}/api/auth/admin/login`,
          { username: "admin", password: adminPassword },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        localStorage.setItem("token", data.token);
        setUser(data.user);
        toast.success("Switched to Platform Administrator! 🛡️");
        onClose();
        navigate("/");
      } catch (error: any) {
        setAdminError(
          error?.response?.data?.message || "Invalid admin password"
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Regular role switch
    try {
      setSubmitting(true);
      const { data } = await axios.put(
        `${authService}/api/auth/add/role`,
        { role: selectedRole },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      localStorage.setItem("token", data.token);
      setUser(data.user);
      toast.success(`Role switched to ${selectedRole}! 🎉`);
      onClose();
      navigate("/");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to switch role");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <BiX size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
            <BiTransfer size={22} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#0D2240]">Switch Role</h2>
            <p className="text-xs text-slate-400">
              Select how you want to experience Cravely
            </p>
          </div>
        </div>

        {/* Role Cards List */}
        <div className="space-y-2.5">
          {roles.map((r) => {
            const isSelected = selectedRole === r.id;
            const isCurrent = user.role === r.id;

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleSelection(r.id)}
                className={`w-full text-left rounded-2xl p-3.5 border transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? "border-[#FB8C00] bg-amber-50/50 shadow-xs ring-2 ring-[#FB8C00]/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0 mt-0.5">{r.icon}</span>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? "text-[#0D2240]" : "text-slate-800"
                          }`}
                        >
                          {r.label}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {r.desc}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`h-4.5 w-4.5 shrink-0 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? "border-[#FB8C00] bg-[#FB8C00] text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <BiCheckCircle size={12} />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Admin Password Input if selecting Admin while not already Admin */}
        {showAdminPasswordInput && (
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <BiShield size={14} className="text-[#FB8C00]" />
              <span>Admin Verification Required</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-tight">
              Enter administrator password to access the Super Admin Console:
            </p>
            <div className="relative flex items-center">
              <BiLockAlt className="absolute left-3 text-slate-400" size={16} />
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSwitch()}
                placeholder="Enter admin password"
                className="w-full rounded-xl border border-amber-300 bg-white pl-9 pr-3 py-2 text-xs outline-none focus:border-[#FB8C00] focus:ring-1 focus:ring-[#FB8C00]"
                autoFocus
              />
            </div>
            {adminError && (
              <p className="text-[11px] font-semibold text-rose-600">
                {adminError}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSwitch}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#0D2240] to-[#163A6B] py-2.5 text-xs font-bold text-white shadow-md shadow-[#0D2240]/20 hover:from-[#09182E] hover:to-[#0F294D] disabled:opacity-50 transition cursor-pointer"
          >
            {submitting ? "Switching..." : "Confirm Switch"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SwitchRoleModal;
