import { useState } from "react";
import type { IMenuItem } from "../types";
import { FiEyeOff } from "react-icons/fi";
import { BsCartPlus, BsEye } from "react-icons/bs";
import { BiTrash } from "react-icons/bi";
import { VscLoading } from "react-icons/vsc";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { useAppData } from "../context/AppContext";

interface MenuItemsProps {
  items: IMenuItem[];
  onItemDeleted: () => void;
  isSeller: boolean;
}

const MenuItems = ({ items, onItemDeleted, isSeller }: MenuItemsProps) => {
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  const handleDelete = async (itemId: string) => {
    const confirm = window.confirm("Are you sure you want to delete this menu item?");
    if (!confirm) return;

    try {
      await axios.delete(`${restaurantService}/api/item/${itemId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("Item deleted");
      onItemDeleted();
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete item");
    }
  };

  const toggleAvailiblity = async (itemId: string) => {
    try {
      const { data } = await axios.put(
        `${restaurantService}/api/item/status/${itemId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success(data.message);
      onItemDeleted();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update status");
    }
  };

  const { fetchCart } = useAppData();

  const addToCart = async (restaurantId: string, itemId: string) => {
    try {
      setLoadingItemId(itemId);

      const { data } = await axios.post(
        `${restaurantService}/api/cart/add`,
        {
          restaurantId,
          itemId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success(data.message || "Added to cart");
      fetchCart();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add item");
    } finally {
      setLoadingItemId(null);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 space-y-2">
        <p className="text-sm font-medium">No menu items listed yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const isLoading = loadingItemId === item._id;

        return (
          <div
            className={`group relative flex gap-4 rounded-2xl bg-white p-4 border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-200 transition-all duration-200 ${
              !item.isAvailable ? "opacity-60 bg-slate-50/60" : ""
            }`}
            key={item._id}
          >
            <div className="relative shrink-0 overflow-hidden rounded-xl">
              <img
                src={item.image}
                alt={item.name}
                className={`h-24 w-24 rounded-xl object-cover transition-transform duration-300 group-hover:scale-105 ${
                  !item.isAvailable ? "grayscale brightness-75" : ""
                }`}
              />
              {!item.isAvailable && (
                <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 text-[10px] font-bold uppercase tracking-wider text-white text-center p-1">
                  Sold Out
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#0D2240] line-clamp-1 group-hover:text-[#FB8C00] transition-colors">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="mt-0.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="font-extrabold text-base text-[#0D2240]">
                  ₹{item.price}
                </p>

                {isSeller && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleAvailiblity(item._id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:text-[#0D2240] hover:bg-slate-100 transition cursor-pointer"
                      title={item.isAvailable ? "Mark Unavailable" : "Mark Available"}
                    >
                      {item.isAvailable ? (
                        <BsEye size={16} />
                      ) : (
                        <FiEyeOff size={16} />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(item._id)}
                      className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete Item"
                    >
                      <BiTrash size={16} />
                    </button>
                  </div>
                )}

                {!isSeller && (
                  <button
                    disabled={!item.isAvailable || isLoading}
                    onClick={() => addToCart(item.restaurantId, item._id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      !item.isAvailable || isLoading
                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                        : "bg-amber-500/10 text-[#FB8C00] hover:bg-[#FB8C00] hover:text-white border border-amber-500/20 shadow-xs"
                    }`}
                  >
                    {isLoading ? (
                      <VscLoading size={14} className="animate-spin" />
                    ) : (
                      <>
                        <BsCartPlus size={14} />
                        ADD
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MenuItems;
