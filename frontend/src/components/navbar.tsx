import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useEffect, useState } from "react";
import { CgShoppingCart } from "react-icons/cg";
import { BiMapPin, BiPackage, BiSearch, BiX } from "react-icons/bi";
import ProfileDropdown from "./ProfileDropdown";

const Navbar = () => {
  const { isAuth, user, city, quauntity } = useAppData();
  const currLocation = useLocation();

  const isHomePage = currLocation.pathname === "/";
  const isCustomer = !user?.role || user?.role === "customer";

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        setSearchParams({ search });
      } else {
        setSearchParams({});
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_12px_rgba(13,34,64,0.04)] transition-all duration-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-2.5">
        {/* Brand Logo & Location */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <img
              src="/logo-icon.png"
              alt="Cravely Logo"
              className="h-9 w-auto object-contain transform transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col justify-center">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0D2240] flex items-center leading-none">
                Cravel<span className="text-[#FB8C00]">y</span>
              </span>
              <span className="text-[10px] font-mono font-medium text-slate-400 tracking-tight leading-none mt-1">
                &lt;developed by Maahir Taneja /&gt;
              </span>
            </div>
          </Link>

          {/* Location Badge (Desktop) */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200/80 px-3 py-1 text-xs text-slate-700 shadow-2xs">
            <BiMapPin className="h-3.5 w-3.5 text-[#FB8C00] shrink-0" />
            <span className="font-medium max-w-44 truncate">{city}</span>
          </div>
        </div>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Orders - only visible for customers */}
          {isAuth && isCustomer && (
            <Link
              to="/orders"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#0D2240] transition py-1 px-2 rounded-lg hover:bg-slate-50"
            >
              <BiPackage className="h-4 w-4 text-slate-500" />
              <span>Orders</span>
            </Link>
          )}

          {/* Cart Icon - only visible for customers and guests */}
          {(!isAuth || isCustomer) && (
            <Link
              to="/cart"
              className="relative flex items-center p-2 rounded-full text-slate-700 hover:text-[#0D2240] hover:bg-slate-100 transition duration-150"
              aria-label="View Cart"
            >
              <CgShoppingCart className="h-5 w-5" />
              {quauntity > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#FB8C00] text-[10px] font-black text-white px-1 shadow-sm animate-fade-in">
                  {quauntity}
                </span>
              )}
            </Link>
          )}

          {/* User Profile / Login */}
          {isAuth ? (
            <ProfileDropdown />
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login?admin=true"
                className="hidden sm:block text-xs font-semibold text-slate-500 hover:text-[#0D2240] transition px-2 py-1"
              >
                Admin
              </Link>
              <Link
                to="/login"
                className="rounded-xl bg-gradient-to-r from-[#0D2240] to-[#163A6B] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-[#08172c] hover:to-[#0f2c56] hover:shadow transition-all duration-200"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Modern Search Bar on Homepage */}
      {isHomePage && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2.5">
          <div className="mx-auto flex max-w-4xl items-center rounded-2xl border border-slate-200 bg-white shadow-xs focus-within:border-[#FB8C00] focus-within:ring-2 focus-within:ring-[#FB8C00]/20 transition-all duration-200">
            {/* Mobile Location */}
            <div className="flex md:hidden items-center gap-1.5 px-3 py-2 border-r border-slate-200 text-slate-700 shrink-0">
              <BiMapPin className="h-3.5 w-3.5 text-[#FB8C00] shrink-0" />
              <span className="text-xs font-semibold truncate max-w-24 sm:max-w-36">
                {city}
              </span>
            </div>

            {/* Search Input */}
            <div className="flex flex-1 items-center gap-2.5 px-3.5 py-2">
              <BiSearch className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search for restaurants, dishes, or cuisines (e.g. Biryani, Pizza)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                  aria-label="Clear search"
                >
                  <BiX size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
