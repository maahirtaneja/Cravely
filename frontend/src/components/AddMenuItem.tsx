import axios from "axios";
import { useState } from "react";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { BiUpload, BiX } from "react-icons/bi";

const AddMenuItem = ({ onItemAdded }: { onItemAdded: () => void }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setImage(null);
    setPreview(null);
  };

  const handleImageChange = (file: File | null) => {
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!name || !price || !image) {
      toast.error("Dish Name, Price, and Image are all required");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("file", image);

    try {
      setLoading(true);
      await axios.post(`${restaurantService}/api/item/new`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("Dish added to menu successfully 🎉");
      resetForm();
      onItemAdded();
    } catch (error) {
      console.log(error);
      toast.error("Failed to add dish");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 py-2">
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-[#0D2240]">Add New Dish</h2>
        <p className="text-xs text-slate-400">
          Upload photo, culinary description, and pricing to your live menu
        </p>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
          Dish Name *
        </label>
        <input
          type="text"
          placeholder="e.g. Paneer Butter Masala"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-[#FB8C00] transition"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
          Description
        </label>
        <textarea
          placeholder="Describe ingredients, taste profile, or portion size..."
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-[#FB8C00] transition"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
          Price (₹) *
        </label>
        <input
          type="number"
          placeholder="e.g. 249"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-[#FB8C00] transition"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
          Dish Photo *
        </label>
        {preview ? (
          <div className="relative rounded-2xl border border-slate-200 overflow-hidden">
            <img
              src={preview}
              alt="Dish preview"
              className="w-full h-36 object-cover"
            />
            <button
              type="button"
              onClick={() => handleImageChange(null)}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition cursor-pointer"
            >
              <BiX size={16} />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 p-4 text-xs text-slate-600 hover:bg-slate-50 transition">
            <BiUpload className="h-5 w-5 text-[#FB8C00]" />
            <span className="font-bold text-[#FB8C00]">
              Upload dish image
            </span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
            />
          </label>
        )}
      </div>

      <button
        disabled={loading}
        onClick={handleSubmit}
        className="w-full rounded-2xl text-white text-xs py-3.5 font-bold transition bg-gradient-to-r from-[#0D2240] to-[#163A6B] hover:from-[#09182E] hover:to-[#0F294D] shadow-md shadow-[#0D2240]/20 disabled:opacity-50 cursor-pointer"
      >
        {loading ? "Adding Dish..." : "Add to Kitchen Menu"}
      </button>
    </div>
  );
};

export default AddMenuItem;
