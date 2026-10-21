import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import EditProfileModal from "./EditProfileModal";
import SwitchRoleModal from "./SwitchRoleModal";
import toast from "react-hot-toast";
import {
  BiChevronDown,
  BiEditAlt,
  BiLogOut,
  BiMapPin,
  BiPackage,
  BiShield,
  BiTransfer,
} from "react-icons/bi";

interface ProfileDropdownProps {
  className?: string;
}

const ProfileDropdown = ({ className = "" }: ProfileDropdownProps) => {
  const { user, setUser, setIsAuth } = useAppData();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSwitchRoleOpen, setIsSwitchRoleOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isAdmin =
    Boolean(user?.isAdmin) ||
    user?.email === "admin@cravely.internal" ||
    user?.role === "admin";

  const isCustomer = !user?.role || user?.role === "customer";

  const firstLetter = user?.name?.charAt(0)?.toUpperCase() || "U";
  const firstName = user?.name?.split(" ")[0] || "User";

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    localStorage.removeItem("token");
    setUser(null);
    setIsAuth(false);
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-amber-300">
          <BiShield size={11} /> Admin
        </span>
      );
    }
    if (user?.role === "rider") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          🛵 Rider
        </span>
      );
    }
    if (user?.role === "seller" || user?.role === "restaurant") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-[#FB8C00]">
          🍳 Restaurant
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
        👤 Customer
      </span>
    );
  };

  if (!user) return null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Avatar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 shadow-2xs hover:border-[#FB8C00]/40 hover:shadow-xs transition duration-200 cursor-pointer focus:outline-none"
        aria-label="User profile menu"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name}
            className="h-7 w-7 rounded-full object-cover ring-1 ring-slate-100"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#0D2240] to-[#163A6B] text-xs font-bold text-white shadow-2xs">
            {firstLetter}
          </div>
        )}
        <span className="text-xs font-semibold text-slate-800 max-w-24 truncate hidden sm:inline">
          {firstName}
        </span>
        <BiChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#FB8C00]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-900/10 z-50 overflow-hidden animate-fade-in divide-y divide-slate-100">
          {/* User Info Header */}
          <div className="p-3.5 bg-gradient-to-br from-slate-50/70 to-white">
            <div className="flex items-center gap-3">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-10 w-10 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0D2240] to-[#163A6B] text-sm font-black text-white shadow-xs">
                  {firstLetter}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#0D2240] truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate font-mono">
                  {user.email}
                </p>
                <div className="mt-1">{getRoleBadge()}</div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-1.5 space-y-0.5">
            {/* Edit Profile */}
            <button
              onClick={() => {
                setIsOpen(false);
                setIsEditOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0D2240] hover:bg-slate-50 transition cursor-pointer text-left"
            >
              <div className="p-1 rounded-lg bg-slate-100 text-slate-600">
                <BiEditAlt size={15} />
              </div>
              <div className="flex-1">
                <span>Edit Profile</span>
                {isAdmin && (
                  <span className="ml-1.5 text-[9px] font-mono text-slate-400">
                    (Immutable)
                  </span>
                )}
              </div>
            </button>

            {/* Customer-specific links */}
            {isCustomer && (
              <>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/orders");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0D2240] hover:bg-slate-50 transition cursor-pointer text-left"
                >
                  <div className="p-1 rounded-lg bg-amber-50 text-[#FB8C00]">
                    <BiPackage size={15} />
                  </div>
                  <span>My Orders</span>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/address");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0D2240] hover:bg-slate-50 transition cursor-pointer text-left"
                >
                  <div className="p-1 rounded-lg bg-sky-50 text-sky-600">
                    <BiMapPin size={15} />
                  </div>
                  <span>Saved Addresses</span>
                </button>
              </>
            )}

            {/* Switch Role Option - ONLY FOR ADMIN */}
            {isAdmin && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsSwitchRoleOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 hover:bg-indigo-50/70 transition cursor-pointer text-left"
              >
                <div className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
                  <BiTransfer size={15} />
                </div>
                <span>Switch Role</span>
              </button>
            )}
          </div>

          {/* Logout Button */}
          <div className="p-1.5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left"
            >
              <div className="p-1 rounded-lg bg-rose-50 text-rose-600">
                <BiLogOut size={15} />
              </div>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />

      {/* Switch Role Modal */}
      <SwitchRoleModal
        isOpen={isSwitchRoleOpen}
        onClose={() => setIsSwitchRoleOpen(false)}
      />
    </div>
  );
};

export default ProfileDropdown;
