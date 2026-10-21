import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { restaurantService } from "../main";
import L from "leaflet";
import { LuLocateFixed } from "react-icons/lu";
import { BiArrowBack, BiLoader, BiPlus, BiTrash, BiMapPin } from "react-icons/bi";

// 🔧 Fix leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: number;
}

// 📍 Click-to-select location
const LocationPicker = ({
  setLocation,
}: {
  setLocation: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      setLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// 🎯 Locate me button
const LocateMeButton = ({
  onLocate,
}: {
  onLocate: (lat: number, lng: number) => void;
}) => {
  const map = useMap();
  const locateUser = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 16, { animate: true });
        onLocate(latitude, longitude);
      },
      () => toast.error("Location permission denied")
    );
  };
  return (
    <button
      onClick={locateUser}
      className="absolute right-3 top-3 z-[450] flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-md hover:bg-slate-50 transition cursor-pointer"
    >
      <LuLocateFixed size={16} className="text-[#FB8C00]" />
      Use Current Location
    </button>
  );
};

const AddAddressPage = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 📋 Form state
  const [mobile, setMobile] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // 🌍 Reverse geocoding
  const fetchFormattedAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      setFormattedAddress(data.display_name || "");
    } catch {
      toast.error("Failed to fetch address");
    }
  };

  const setLocation = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    fetchFormattedAddress(lat, lng);
  };

  // 📡 Fetch addresses
  const fetchAddresses = async () => {
    try {
      const { data } = await axios.get(`${restaurantService}/api/address/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setAddresses(data || []);
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // ➕ Add address
  const addAddress = async () => {
    if (
      !mobile ||
      !formattedAddress ||
      latitude === null ||
      longitude === null
    ) {
      toast.error("Please tap on map to pick your location & enter mobile");
      return;
    }
    try {
      setAdding(true);
      await axios.post(
        `${restaurantService}/api/address/new`,
        {
          formattedAddress,
          mobile,
          latitude,
          longitude,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Delivery address added");
      setMobile("");
      setFormattedAddress("");
      setLatitude(null);
      setLongitude(null);
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add address");
    } finally {
      setAdding(false);
    }
  };

  // 🗑 Delete address
  const deleteAddress = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      setDeletingId(id);
      await axios.delete(`${restaurantService}/api/address/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Address deleted");
      fetchAddresses();
    } catch {
      toast.error("Failed to delete address");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0D2240] transition cursor-pointer"
        >
          <BiArrowBack size={16} />
          Back
        </button>

        <div>
          <h1 className="text-2xl font-extrabold text-[#0D2240]">Delivery Addresses</h1>
          <p className="text-xs text-slate-400 mt-0.5">Select a pin on the map to save new drop-off points</p>
        </div>

        {/* 🗺 Map Card */}
        <div className="relative z-0 isolate h-96 w-full overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
          <MapContainer
            center={[latitude || 28.6139, longitude || 77.209]}
            zoom={13}
            className="h-full w-full"
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <LocationPicker setLocation={setLocation} />
            <LocateMeButton onLocate={setLocation} />
            {latitude && longitude && <Marker position={[latitude, longitude]} />}
          </MapContainer>
        </div>

        {/* Form Container */}
        <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#0D2240]">Add New Address</h2>

          {/* 📍 Selected address preview */}
          {formattedAddress ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-900 leading-relaxed">
              📍 <strong>Selected:</strong> {formattedAddress}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-3.5 text-xs text-slate-400 text-center">
              Tap anywhere on the map above to select your exact delivery doorstep
            </div>
          )}

          {/* 📱 Mobile Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contact Phone Number
            </label>
            <input
              type="number"
              placeholder="Enter 10-digit delivery contact number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#FB8C00] transition"
            />
          </div>

          {/* ➕ Save */}
          <button
            disabled={adding}
            onClick={addAddress}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0D2240] to-[#163A6B] px-5 py-3.5 text-xs font-bold text-white shadow-md shadow-[#0D2240]/20 hover:from-[#09182E] hover:to-[#0F294D] transition-all cursor-pointer disabled:opacity-50"
          >
            {adding ? (
              <BiLoader className="animate-spin" size={16} />
            ) : (
              <BiPlus size={16} />
            )}
            Save Delivery Address
          </button>
        </div>

        {/* 📋 Saved Addresses */}
        <div className="space-y-3.5 pt-2">
          <h2 className="text-sm font-bold text-[#0D2240] uppercase tracking-wider">
            Your Saved Locations
          </h2>
          {loading ? (
            <p className="text-xs text-slate-400">Loading saved addresses...</p>
          ) : addresses.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center text-xs text-slate-400 border border-slate-100 shadow-sm">
              No saved addresses yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {addresses.map((addr) => (
                <div
                  key={addr._id}
                  className="flex items-start justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-xs hover:shadow-md transition-all gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-50 text-[#FB8C00] shrink-0 mt-0.5">
                      <BiMapPin size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed line-clamp-2">
                        {addr.formattedAddress}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        📞 {addr.mobile}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAddress(addr._id)}
                    disabled={deletingId === addr._id}
                    className="rounded-xl p-2 text-rose-500 hover:bg-rose-50 transition cursor-pointer shrink-0 disabled:opacity-50"
                    title="Delete address"
                  >
                    {deletingId === addr._id ? (
                      <BiLoader size={16} className="animate-spin" />
                    ) : (
                      <BiTrash size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddAddressPage;
