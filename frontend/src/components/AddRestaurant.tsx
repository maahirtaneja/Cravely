import { useState } from "react";
import { useAppData } from "../context/AppContext";
import toast from "react-hot-toast";
import axios from "axios";
import { restaurantService } from "../main";
import { BiMapPin, BiUpload, BiX } from "react-icons/bi";
import ProfileDropdown from "./ProfileDropdown";

interface props {
  fetchMyRestaurant: () => Promise<void>;
}

const AddRestaurant = ({ fetchMyRestaurant }: props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { loadingLocation, location } = useAppData();

  const handleImageChange = (file: File | null) => {
    setImage(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!name || !image || !phone) {
      toast.error("Please fill in Restaurant Name, Phone, and upload an Image");
      return;
    }

    if (!location) {
      toast.error("Location not detected. Please enable GPS permissions.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("latitude", String(location.latitude));
    formData.append("longitude", String(location.longitude));
    formData.append("formattedAddress", location.formattedAddress);
    formData.append("file", image);
    formData.append("phone", phone);

    try {
      setSubmitting(true);
      await axios.post(`${restaurantService}/api/restaurant/new`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("Restaurant added successfully 🎉");
      fetchMyRestaurant();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add restaurant");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Top Navigation Bar */}
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
              Kitchen Onboarding
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ProfileDropdown />
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="px-4 py-8">
        <div className="mx-auto max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100 space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-[#0D2240]">Add Your Restaurant</h1>
            <p className="text-xs text-slate-500">
              Set up your restaurant profile to start receiving orders on Cravely
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Restaurant Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Royal Spice Kitchen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-[#FB8C00]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Contact Phone Number *
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-[#FB8C00]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Restaurant Description
            </label>
            <textarea
              placeholder="Tell customers about your cuisine, specialities, or dining experience..."
              value={description}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-[#FB8C00]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Restaurant Banner / Cover Photo *
            </label>
            {preview ? (
              <div className="relative rounded-2xl border border-slate-200 overflow-hidden group">
                <img
                  src={preview}
                  alt="Restaurant preview"
                  className="w-full h-44 object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleImageChange(null)}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition cursor-pointer"
                >
                  <BiX size={18} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer transition">
                <div className="h-10 w-10 rounded-2xl bg-amber-50 text-[#FB8C00] flex items-center justify-center">
                  <BiUpload size={20} />
                </div>
                <div className="text-center">
                  <span className="font-bold text-[#FB8C00]">Click to upload</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, or WEBP up to 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>

          {/* Location status */}
          <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
            <BiMapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#FB8C00]" />
            <div className="text-xs text-slate-600">
              <span className="font-bold block text-[#0D2240]">Auto-Detected Kitchen Location</span>
              {loadingLocation ? (
                <span className="text-slate-400">Fetching current location coordinates...</span>
              ) : (
                location?.formattedAddress || "Location permission required"
              )}
            </div>
          </div>

          <button
            className={`w-full rounded-2xl py-3.5 text-xs font-bold text-white transition-all shadow-md ${
              submitting
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-gradient-to-r from-[#0D2240] to-[#163A6B] hover:from-[#09182E] hover:to-[#0F294D] shadow-[#0D2240]/20 cursor-pointer"
            }`}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Adding Restaurant..." : "Add Restaurant"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRestaurant;
