import { useState } from "react";
import type { IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { BiEdit, BiMapPin, BiSave } from "react-icons/bi";
import { useAppData } from "../context/AppContext";

interface props {
  restaurant: IRestaurant;
  isSeller: boolean;
  onUpdate: (restaurant: IRestaurant) => void;
}

const RestaurantProfile = ({ restaurant, isSeller, onUpdate }: props) => {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description);
  const [isOpen, setIsOpen] = useState(restaurant.isOpen);
  const [loading, setLoading] = useState(false);

  const toggleOpenStatus = async () => {
    try {
      const { data } = await axios.put(
        `${restaurantService}/api/restaurant/status`,
        { status: !isOpen },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success(data.message);
      setIsOpen(data.restaurant.isOpen);
    } catch (error: any) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to toggle status");
    }
  };

  const saveChanges = async () => {
    try {
      setLoading(true);
      const { data } = await axios.put(
        `${restaurantService}/api/restaurant/edit`,
        { name, description },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success(data.message);
      onUpdate(data.restaurant);
      setEditMode(false);
    } catch (error) {
      console.log(error);
      toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const { setIsAuth, setUser } = useAppData();

  const logoutHandler = async () => {
    await axios.put(
      `${restaurantService}/api/restaurant/status`,
      { status: false },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    localStorage.setItem("token", "");
    setIsAuth(false);
    setUser(null);
    toast.success("Logged out successfully");
  };

  return (
    <div className="w-full rounded-3xl bg-white shadow-sm border border-slate-100 overflow-hidden">
      {restaurant.image && (
        <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-100">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          
          <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-white">
            <span
              className={`rounded-full px-3.5 py-1 text-xs font-bold tracking-wide uppercase shadow-sm backdrop-blur-md ${
                isOpen
                  ? "bg-emerald-500/90 text-white"
                  : "bg-rose-500/90 text-white"
              }`}
            >
              {isOpen ? "🟢 OPEN NOW" : "🔴 CLOSED"}
            </span>
            <span className="text-xs font-medium text-white/90 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
              ⚡ 25-35 mins
            </span>
          </div>
        </div>
      )}
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {editMode ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xl font-bold text-[#0D2240] focus:outline-none focus:border-[#FB8C00]"
              />
            ) : (
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D2240] tracking-tight">
                {restaurant.name}
              </h1>
            )}

            <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-slate-500">
              <BiMapPin className="h-4 w-4 text-[#FB8C00] shrink-0" />
              <span>{restaurant.autoLocation?.formattedAddress || "Location unavailable"}</span>
            </div>
          </div>

          {isSeller && (
            <button
              onClick={() => setEditMode(!editMode)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:text-[#0D2240] hover:bg-slate-50 transition cursor-pointer"
            >
              <BiEdit size={18} />
            </button>
          )}
        </div>

        {editMode ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#FB8C00]"
            rows={3}
          />
        ) : (
          <p className="text-sm text-slate-600 leading-relaxed">
            {restaurant.description || "Delightful food crafted with authentic recipes & fresh ingredients."}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isOpen
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isOpen ? "bg-emerald-500" : "bg-rose-500"}`} />
              {isOpen ? "Accepting Orders" : "Currently Not Accepting Orders"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {editMode && (
              <button
                onClick={saveChanges}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0D2240] to-[#163A6B] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-[#09182E] hover:to-[#0F294D] transition cursor-pointer"
              >
                <BiSave size={16} />
                Save Changes
              </button>
            )}

            {isSeller && (
              <button
                onClick={toggleOpenStatus}
                className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition cursor-pointer shadow-sm ${
                  isOpen
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isOpen ? "Close Restaurant" : "Open Restaurant"}
              </button>
            )}

            {isSeller && (
              <button
                onClick={logoutHandler}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Member since {new Date(restaurant.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default RestaurantProfile;
