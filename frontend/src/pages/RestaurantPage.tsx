import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { IMenuItem, IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import { BiArrowBack } from "react-icons/bi";

const RestaurantPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRestaurant = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setRestaurant(data || null);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/item/all/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setMenuItems(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRestaurant();
      fetchMenuItems();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#FB8C00] border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading menu & restaurant...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center space-y-4 px-4 text-center">
        <p className="text-base font-semibold text-slate-700">Restaurant not found or has been removed</p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0D2240] to-[#163A6B] px-5 py-3 text-sm font-semibold text-white shadow-md hover:from-[#09182E] hover:to-[#0F294D] transition cursor-pointer"
        >
          <BiArrowBack size={18} />
          Explore Other Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Back navigation button */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0D2240] transition cursor-pointer"
        >
          <BiArrowBack size={16} />
          Back to Restaurants
        </button>

        <RestaurantProfile
          restaurant={restaurant}
          onUpdate={setRestaurant}
          isSeller={false}
        />

        <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#0D2240]">
                Menu Items
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Crafted with care by the kitchen</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {menuItems.length} {menuItems.length === 1 ? "dish" : "dishes"}
            </span>
          </div>

          <MenuItems
            isSeller={false}
            items={menuItems}
            onItemDeleted={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default RestaurantPage;
