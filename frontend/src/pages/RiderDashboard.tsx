import { useEffect, useRef, useState } from "react";
import { useAppData } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { riderService } from "../main";
import toast from "react-hot-toast";
import { BiUpload } from "react-icons/bi";
import type { IOrder } from "../types";
import audio from "../assets/rider-chime.mp3";
import RiderOrderRequest from "../components/RiderOrderRequest";
import RiderCurrentOrder from "../components/RiderCurrentOrder";
import RiderOrderMap from "../components/RiderOrderMap";
import ProfileDropdown from "../components/ProfileDropdown";

interface IRider {
  _id: string;
  phoneNumber: string;
  aadharNumber: string;
  drivingLicenseNumber: string;
  picture: string;
  isVerified: boolean;
  isAvailble: boolean;
}

const RiderDashboard = () => {
  const { user } = useAppData();
  const { socket } = useSocket();

  const [profile, setProfile] = useState<IRider | null>(null);
  const [loading, setLoading] = useState(true);

  const [toggling, setToggling] = useState(false);

  const [incomingOrders, setIncomingOrders] = useState<string[]>([]);
  const [currentOrder, setCurrentOrder] = useState<IOrder | null>(null);

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    audioRef.current = new Audio(audio);
    audioRef.current.preload = "auto";
  }, []);

  const unlockAudio = async () => {
    try {
      if (!audioRef.current) return;
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioUnlocked(true);
      toast.success("Sound Enabled");
    } catch (error) {
      toast.error("Tap again to enable sound");
    }
  };

  useEffect(() => {
    if (!socket) return;

    const onOrderAvailable = ({ orderId }: { orderId: string }) => {
      setIncomingOrders((prev) =>
        prev.includes(orderId) ? prev : [...prev, orderId]
      );

      if (audioUnlocked && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    };

    const onOrderTaken = ({
      orderId,
      message,
    }: {
      orderId: string;
      message?: string;
    }) => {
      console.log(`Order ${orderId} was taken by another rider`);
      setIncomingOrders((prev) => {
        const remaining = prev.filter((id) => id !== orderId);
        if (remaining.length === 0) {
          stopAudio();
        }
        return remaining;
      });
      toast(message || "Order was already accepted by another rider", {
        icon: "🛵",
        id: `taken-${orderId}`,
      });
    };

    socket.on("order:available", onOrderAvailable);
    socket.on("order:taken", onOrderTaken);

    socket.emit("join", "riders");

    return () => {
      socket.off("order:available", onOrderAvailable);
      socket.off("order:taken", onOrderTaken);
    };
  }, [socket, audioUnlocked]);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${riderService}/api/rider/myprofile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setProfile(data || null);
    } catch (error) {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "rider") fetchProfile();
    else setLoading(false);
  }, [user]);

  const fetchCurrentOrder = async () => {
    try {
      const { data } = await axios.get(
        `${riderService}/api/rider/order/current`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setCurrentOrder(data.order);
    } catch (error) {
      console.log(error);
      setCurrentOrder(null);
    }
  };

  useEffect(() => {
    fetchCurrentOrder();
  }, []);

  const toggleAvailiblity = async () => {
    if (!navigator.geolocation) {
      toast.error("Location Access Required");
      return;
    }

    setToggling(true);

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await axios.patch(
          `${riderService}/api/rider/toggle`,
          {
            isAvailble: !profile?.isAvailble,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        toast.success(
          profile?.isAvailble ? "You are offline" : "You are online"
        );
        fetchProfile();
      } catch (error: any) {
        toast.error(error.response.data.message);
      } finally {
        setToggling(false);
      }
    });
  };

  const [phoneNumber, setPhoneNumber] = useState("");
  const [aadharNumber, setaadharNumber] = useState("");
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!navigator.geolocation) {
      toast.error("Location Access Required");
      return;
    }

    setSubmitting(true);

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const formData = new FormData();

      formData.append("phoneNumber", phoneNumber);
      formData.append("aadharNumber", aadharNumber);
      formData.append("drivingLicenseNumber", drivingLicenseNumber);
      formData.append("latitude", pos.coords.latitude.toString());
      formData.append("longitude", pos.coords.longitude.toString());

      if (image) {
        formData.append("file", image);
      }

      try {
        const { data } = await axios.post(
          `${riderService}/api/rider/new`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        toast.success(data.message);
        fetchProfile();
      } catch (error: any) {
        toast.error(error.response.data.message);
      } finally {
        setSubmitting(false);
      }
    });
  };

  if (user?.role !== "rider") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
        You are not registered as a rider
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
        Loading rider details...
      </div>
    );
  }

  if (!profile)
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-12">
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
                Rider Portal
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ProfileDropdown />
            </div>
          </div>
        </div>
        <div className="px-4 py-8">
          <div className="mx-auto max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100 space-y-5">
            <h1 className="text-2xl font-extrabold text-[#0D2240]">Complete Rider Registration</h1>
            <p className="text-xs text-slate-500">Submit your verification credentials to start delivering with Cravely</p>
          <input
            type="number"
            placeholder="Aadhar Number (12 digits)"
            value={aadharNumber}
            onChange={(e) => setaadharNumber(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-[#FB8C00]"
          />
          <input
            type="number"
            placeholder="Contact Number (10 digits)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-[#FB8C00]"
          />

          <input
            type="text"
            placeholder="Driving License Number"
            value={drivingLicenseNumber}
            onChange={(e) => setDrivingLicenseNumber(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-[#FB8C00]"
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-4 text-xs text-slate-600 hover:bg-slate-50">
            <BiUpload className="h-5 w-5 text-[#FB8C00]" />
            {image ? image.name : "Upload profile photograph"}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setImage(file);
              
            }}
            />
          </label>

          <button
            className="w-full rounded-2xl py-3.5 text-xs font-bold text-white bg-gradient-to-r from-[#0D2240] to-[#163A6B] hover:from-[#09182E] hover:to-[#0F294D] shadow-md shadow-[#0D2240]/20 cursor-pointer disabled:opacity-50"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Submitting Registration..." : "Submit Rider Profile"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
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
              Rider Portal
            </span>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${profile.isAvailble ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
              {profile.isAvailble ? "🟢 Online" : "⚪ Offline"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ProfileDropdown />
          </div>
        </div>
      </div>

      <div className="space-y-5 pt-6">
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 space-y-4">
          <img
            src={profile.picture}
            className="mx-auto h-24 w-24 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
            alt=""
          />
          <div className="text-center">
            <p className="font-extrabold text-base text-[#0D2240]">{user?.name}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              📞 {profile.phoneNumber}
            </p>
          </div>

          <div className="flex justify-center gap-2 pt-1">
            <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${profile.isVerified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
              {profile.isVerified ? "✓ Verified Partner" : "Pending Verification"}
            </span>

            <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${profile.isAvailble ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
              {profile.isAvailble ? "Active on Road" : "Resting (Offline)"}
            </span>
          </div>

          <div className="rounded-2xl bg-amber-50/70 p-3 border border-amber-200/60">
            <p className="text-[11px] text-amber-900 leading-relaxed">
              📍 <strong>Hotspot Notice:</strong> Stay within a 500m radius of Cravely restaurant clusters to immediately receive high-priority delivery requests.
            </p>
          </div>

          {profile.isVerified && !currentOrder && (
            <button
              onClick={toggleAvailiblity}
              disabled={toggling}
              className={`w-full py-3.5 rounded-2xl text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                toggling
                  ? "bg-slate-400"
                  : profile.isAvailble
                  ? "bg-slate-700 hover:bg-slate-800"
                  : "bg-gradient-to-r from-[#FB8C00] to-[#F59E0B] hover:from-[#E67E00] hover:to-[#D97706] shadow-amber-500/20"
              }`}
            >
              {toggling
                ? "Updating Status..."
                : profile.isAvailble
                ? "Go Offline"
                : "⚡ Go Online & Accept Cravings"}
            </button>
          )}
        </div>
      </div>

      {!audioUnlocked && (
        <div className="mx-auto max-w-md px-4">
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔔</span>
              <div>
                <p className="font-bold text-xs text-[#0D2240]">
                  Enable Rider Chime
                </p>
                <p className="text-[11px] text-slate-500">
                  Hear sound chimes for incoming delivery requests
                </p>
              </div>
            </div>

            <button
              onClick={unlockAudio}
              className="bg-gradient-to-r from-[#0D2240] to-[#163A6B] hover:from-[#09182E] hover:to-[#0F294D] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Enable Sound
            </button>
          </div>
        </div>
      )}

      {profile.isAvailble && incomingOrders.length > 0 && (
        <div className="mx-auto max-w-md px-4 space-y-3">
          <h3 className=" font-semibold text-gray-700">Incoming Orders</h3>
          {incomingOrders.map((id) => (
            <RiderOrderRequest
              key={id}
              orderId={id}
              onAccepting={stopAudio}
              onAccepted={() => {
                stopAudio();
                setIncomingOrders((prev) => prev.filter((oId) => oId !== id));
                fetchProfile();
                fetchCurrentOrder();
              }}
              onDismiss={() => {
                setIncomingOrders((prev) => {
                  const remaining = prev.filter((oId) => oId !== id);
                  if (remaining.length === 0) {
                    stopAudio();
                  }
                  return remaining;
                });
              }}
            />
          ))}
        </div>
      )}

      {currentOrder && (
        <div className="mx-auto max-w-md px-4 space-y-4">
          <RiderCurrentOrder
            order={currentOrder}
            onStatusUpdate={fetchCurrentOrder}
          />
          <RiderOrderMap order={currentOrder} />
        </div>
      )}
      </div>
    </div>
  );
};

export default RiderDashboard;
