import { useEffect, useState } from "react";
import type { IMenuItem, IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import AddRestaurant from "../components/AddRestaurant";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import AddMenuItem from "../components/AddMenuItem";
import RestaurantOrders from "../components/RestaurantOrders";
import ProfileDropdown from "../components/ProfileDropdown";

type SellerTab = "menu" | "add-item" | "sales";

const Restaurant = () => {
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<SellerTab>("menu");

  const fetchMyRestaurant = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/my`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setRestaurant(data.restaurant || null);

      if (data.token) {
        localStorage.setItem("token", data.token);
        window.location.reload();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRestaurant();
  }, []);

  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);

  const fetchMenuItems = async (restaurantId: string) => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/item/all/${restaurantId}`,
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
    if (restaurant?._id) {
      fetchMenuItems(restaurant._id);
    }
  }, [restaurant]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#FB8C00] border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading your restaurant portal...</p>
        </div>
      </div>
    );

  if (!restaurant) {
    return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* Top Bar for Seller */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-xs sticky top-0 z-30">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
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
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0D2240] border border-slate-200">
              Kitchen Console
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ProfileDropdown />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <RestaurantProfile
          restaurant={restaurant}
          onUpdate={setRestaurant}
          isSeller={true}
        />

        <RestaurantOrders restaurantId={restaurant._id} />

        <div className="rounded-3xl bg-white shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            {[
              { key: "menu", label: "Menu Catalogue" },
              { key: "add-item", label: "Add New Item" },
              { key: "sales", label: "Sales & Insights" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as SellerTab)}
                className={`flex-1 px-4 py-3.5 text-xs font-bold transition cursor-pointer ${
                  tab === t.key
                    ? "border-b-2 border-[#FB8C00] text-[#0D2240] bg-white shadow-xs"
                    : "text-slate-500 hover:text-[#0D2240] hover:bg-slate-100/60"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === "menu" && (
              <MenuItems
                items={menuItems}
                onItemDeleted={() => fetchMenuItems(restaurant._id)}
                isSeller={true}
              />
            )}
            {tab === "add-item" && (
              <AddMenuItem onItemAdded={() => fetchMenuItems(restaurant._id)} />
            )}
            {tab === "sales" && (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <p className="font-bold text-slate-700 text-sm">Kitchen Analytics</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Sales metrics, peak order timings, and item performance data will populate as orders are completed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Restaurant;
