import { useState } from "react";
import { createPortal } from "react-dom";
import { useAppData } from "../context/AppContext";
import axios from "axios";
import { authService } from "../main";
import toast from "react-hot-toast";
import {
  BiLockAlt,
  BiShield,
  BiTrash,
  BiUser,
  BiX,
  BiLoader,
  BiSave,
} from "react-icons/bi";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal = ({ isOpen, onClose }: EditProfileModalProps) => {
  const { user, setUser, setIsAuth } = useAppData();

  // Split user.name into First and Last name
  const nameParts = (user?.name || "").trim().split(" ");
  const initialFirstName = nameParts[0] || "";
  const initialLastName = nameParts.slice(1).join(" ") || "";

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  if (!isOpen || !user) return null;

  const isAdmin =
    Boolean(user?.isAdmin) ||
    user?.email === "admin@cravely.internal" ||
    user?.role === "admin";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin) {
      toast("Admin profile cannot be modified", { icon: "🔒" });
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      toast.error("Please enter your name");
      return;
    }

    try {
      setSaving(true);
      const { data } = await axios.put(
        `${authService}/api/auth/profile/update`,
        { name: fullName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      setUser(data.user);
      toast.success("Profile updated successfully! 🎉");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (isAdmin) {
      toast.error("Administrator account cannot be deleted");
      return;
    }

    if (deleteInput.trim().toUpperCase() !== "DELETE") {
      toast.error("Please type DELETE to confirm permanent deletion");
      return;
    }

    try {
      setDeleting(true);
      await axios.delete(`${authService}/api/auth/account/delete`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      localStorage.removeItem("token");
      setUser(null);
      setIsAuth(false);
      toast.success("Your account and all associated data have been permanently erased.");
      window.location.href = "/login";
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  const firstLetter = user?.name?.charAt(0)?.toUpperCase() || "U";

  if (typeof document === "undefined") return null;

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
        <div className="flex items-center gap-3.5">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="h-14 w-14 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0D2240] text-xl font-bold text-white shadow-md">
              {firstLetter}
            </div>
          )}
          <div>
            <h2 className="text-lg font-extrabold text-[#0D2240]">
              {isAdmin ? "Admin Security Profile" : "Edit Profile"}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FB8C00]">
                {user.role || "Customer"}
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0D2240]">
                  <BiShield size={11} className="text-[#FB8C00]" />
                  Protected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Admin immutable notice */}
        {isAdmin && (
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3 text-xs text-amber-900 leading-relaxed">
            🔒 <strong>Immutable Account:</strong> Administrator credentials and profile records are system-protected and cannot be edited or deleted.
          </div>
        )}

        {/* Edit Profile Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                First Name
              </label>
              <div className="relative flex items-center">
                <BiUser className="absolute left-3 text-slate-400" size={16} />
                <input
                  type="text"
                  value={firstName}
                  disabled={isAdmin}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className={`w-full rounded-2xl border pl-9 pr-3 py-2.5 text-xs outline-none transition ${
                    isAdmin
                      ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                      : "border-slate-200 focus:border-[#FB8C00] focus:ring-1 focus:ring-[#FB8C00]"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                disabled={isAdmin}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className={`w-full rounded-2xl border px-3 py-2.5 text-xs outline-none transition ${
                  isAdmin
                    ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                    : "border-slate-200 focus:border-[#FB8C00] focus:ring-1 focus:ring-[#FB8C00]"
                }`}
              />
            </div>
          </div>

          {/* Email Address (Permanently Immutable) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                <BiLockAlt size={12} /> Non-changeable
              </span>
            </div>
            <div className="relative flex items-center">
              <BiLockAlt className="absolute left-3 text-slate-400" size={16} />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-2xl border border-slate-200 bg-slate-100/80 pl-9 pr-3 py-2.5 text-xs text-slate-500 font-mono outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Save Button (Customer/Rider/Seller only) */}
          {!isAdmin && (
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[#0D2240] to-[#163A6B] py-3 text-xs font-bold text-white shadow-md shadow-[#0D2240]/20 hover:from-[#09182E] hover:to-[#0F294D] transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <BiLoader size={16} className="animate-spin" />
              ) : (
                <BiSave size={16} />
              )}
              {saving ? "Saving Changes..." : "Save Profile Changes"}
            </button>
          )}
        </form>

        {/* Permanent Account Deletion (Danger Zone) */}
        {!isAdmin && (
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-4 space-y-3 pt-3">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
              <BiTrash size={16} />
              <span>Permanent Account Deletion</span>
            </div>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              Permanently delete your Cravely account and all associated entries
              (profile details, addresses, restaurant listings, or rider profiles) from the database. This action cannot be reversed.
            </p>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full rounded-xl border border-rose-300 bg-white py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-2 pt-1 border-t border-rose-200">
                <p className="text-[11px] font-semibold text-rose-800">
                  Type <strong>DELETE</strong> to confirm permanent erasure:
                </p>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-mono text-rose-700 outline-none focus:border-rose-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteInput("");
                    }}
                    className="flex-1 rounded-xl border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleting || deleteInput.trim().toUpperCase() !== "DELETE"}
                    onClick={handlePermanentDelete}
                    className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-40 transition cursor-pointer"
                  >
                    {deleting ? "Erasing Data..." : "Permanently Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default EditProfileModal;
