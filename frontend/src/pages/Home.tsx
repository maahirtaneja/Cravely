import { useSearchParams } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useEffect, useMemo, useState } from "react";
import type { IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import RestaurantCard from "../components/RestaurantCard";
import { BiSolidOffer } from "react-icons/bi";

const CATEGORIES = [
  { label: "All", icon: "🍽️", query: "" },
  { label: "Biryani", icon: "🍗", query: "biryani" },
  { label: "Burgers", icon: "🍔", query: "burger" },
  { label: "Pizza", icon: "🍕", query: "pizza" },
  { label: "Pan Asian", icon: "🍜", query: "wok" },
  { label: "South Indian", icon: "🥞", query: "dosa" },
  { label: "Chai & Snacks", icon: "☕", query: "chai" },
  { label: "Desserts", icon: "🍰", query: "sweet" },
  { label: "Mexican", icon: "🌮", query: "taco" },
];

const Home = () => {
  const { location, city } = useAppData();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);
  const [filterNearbyOnly, setFilterNearbyOnly] = useState(false);

  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const getDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return +(R * c).toFixed(2);
  };

  const fetchRestaurants = async () => {
    const lat = location?.latitude ?? 26.828;
    const lon = location?.longitude ?? 75.789;

    try {
      setLoading(true);

      const activeQuery = search || selectedCategory;

      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/all`,
        {
          params: {
            latitude: lat,
            longitude: lon,
            search: activeQuery,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setRestaurants(data.restaurants ?? []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [location?.latitude, location?.longitude, search, selectedCategory]);

  const currentLat = location?.latitude ?? 26.828;
  const currentLon = location?.longitude ?? 75.789;

  // Client-side quick filter toggles
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((res) => {
      if (filterOpenOnly && !res.isOpen) return false;
      if (filterNearbyOnly) {
        const [resLng, resLat] = res.autoLocation.coordinates;
        const d = getDistanceKm(currentLat, currentLon, resLat, resLng);
        if (d > 1.0) return false;
      }
      return true;
    });
  }, [restaurants, filterOpenOnly, filterNearbyOnly, currentLat, currentLon]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-5 space-y-6">
        {/* Sleek Minimalist Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0D2240] via-[#102A4E] to-[#163A6B] p-6 sm:p-8 text-white shadow-lg">
          <div className="relative z-10 max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-semibold text-[#FB8C00] border border-white/10">
              <BiSolidOffer size={14} />
              <span>Special Offer: Free delivery on your first order</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Delicious cravings, <br className="hidden sm:inline" />
              delivered in minutes.
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
              Explore handpicked restaurants in <span className="text-[#FB8C00] font-semibold">{city}</span> with live tracking from kitchen to your door.
            </p>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute right-[-40px] -bottom-10 h-64 w-64 rounded-full bg-[#FB8C00]/10 blur-3xl pointer-events-none" />
          <div className="absolute right-6 bottom-4 hidden md:flex items-center gap-3 opacity-90 pointer-events-none">
            <img src="/logo.png" alt="" className="h-28 w-28 object-contain filter drop-shadow-xl" />
          </div>
        </div>

        {/* Quick Categories Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              What are you craving?
            </h2>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory("")}
                className="text-xs font-semibold text-[#FB8C00] hover:underline cursor-pointer"
              >
                Clear Category
              </button>
            )}
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.query;
              return (
                <button
                  key={cat.label}
                  onClick={() => {
                    setSelectedCategory(isActive ? "" : cat.query);
                    if (search) setSearchParams({});
                  }}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-2xs transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#0D2240] text-white shadow-sm -translate-y-0.5"
                      : "bg-white text-slate-700 border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-base leading-none">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters and Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/70">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold text-[#0D2240]">
              {selectedCategory
                ? `${selectedCategory.toUpperCase()} Restaurants`
                : search
                ? `Results for "${search}"`
                : "Top Restaurants Around You"}
            </span>
            <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              {filteredRestaurants.length}
            </span>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterOpenOnly((prev) => !prev)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                filterOpenOnly
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              🟢 Open Now
            </button>

            <button
              onClick={() => setFilterNearbyOnly((prev) => !prev)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                filterNearbyOnly
                  ? "bg-[#0D2240] text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              📍 Under 1 km
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && restaurants.length === 0 ? (
          <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-3 border-slate-200 border-t-[#FB8C00]" />
            <p className="text-xs font-semibold text-slate-500">
              Loading top restaurants near you...
            </p>
          </div>
        ) : filteredRestaurants.length > 0 ? (
          /* Restaurant Cards Grid */
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 sm:grid-cols-3 md:grid-cols-4">
            {filteredRestaurants.map((res) => {
              const [resLng, resLat] = res.autoLocation.coordinates;
              const distance = getDistanceKm(currentLat, currentLon, resLat, resLng);

              return (
                <RestaurantCard
                  key={res._id}
                  id={res._id}
                  name={res.name}
                  image={res.image ?? ""}
                  distance={`${distance}`}
                  isOpen={res.isOpen}
                />
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white border border-slate-200/80 py-16 px-4 text-center space-y-3 shadow-2xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-2xl">
              🔍
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-[#0D2240]">
                No restaurants matched your filters
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                Try clearing your search query or toggling off filters to explore more options.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchParams({});
                setSelectedCategory("");
                setFilterOpenOnly(false);
                setFilterNearbyOnly(false);
              }}
              className="rounded-xl bg-[#0D2240] px-4 py-2 text-xs font-semibold text-white hover:bg-[#163A6B] transition cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Footer Signature */}
        <div className="pt-8 pb-4 flex flex-col items-center justify-center gap-2 border-t border-slate-200/60 mt-12">
          <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3.5 py-1 text-[11px] font-mono font-medium text-slate-500 shadow-2xs">
            &lt;developed by Maahir Taneja /&gt;
          </span>
          <p className="text-[11px] text-slate-400">
            Cravely &copy; {new Date().getFullYear()} &bull; Fresh food delivered fast
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
