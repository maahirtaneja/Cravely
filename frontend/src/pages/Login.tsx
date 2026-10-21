import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../main";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { useAppData } from "../context/AppContext";
import { BiLockAlt, BiShieldQuarter } from "react-icons/bi";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);

  // Admin login credentials
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser, setIsAuth } = useAppData();

  const responseGoogle = async (authResult: any) => {
    setLoading(true);
    try {
      const result = await axios.post(`${authService}/api/auth/login`, {
        code: authResult["code"],
      });

      localStorage.setItem("token", result.data.token);
      toast.success(result.data.message || "Logged in successfully");
      setUser(result.data.user);
      setIsAuth(true);
      navigate("/");
    } catch (error) {
      console.log(error);
      toast.error("Problem during Google login");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) {
      toast.error("Please enter admin password");
      return;
    }

    setAdminLoading(true);
    try {
      const { data } = await axios.post(`${authService}/api/auth/admin/login`, {
        password: adminPassword,
      });

      localStorage.setItem("token", data.token);
      setUser(data.user);
      setIsAuth(true);
      toast.success(`Welcome, ${data.user.name}! 🎉`);
      navigate("/");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Invalid admin password"
      );
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-12 relative overflow-hidden">
      {/* Background ambient decorative blurs */}
      <div className="absolute top-[-10%] left-[-10%] h-96 w-96 rounded-full bg-[#0D2240]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-96 w-96 rounded-full bg-[#FB8C00]/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm flex flex-col items-center gap-4">
        <div className="w-full rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
        <div className="text-center space-y-3">
          <img
            src="/logo-icon.png"
            alt="Cravely"
            className="h-14 w-auto mx-auto object-contain hover:scale-105 transition-transform duration-300"
          />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0D2240]">
              Cravel<span className="text-[#FB8C00]">y</span>
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-1.5">
              {showAdminForm
                ? "Admin Management Portal"
                : "Satisfy your cravings in minutes"}
            </p>
          </div>
        </div>

        {!showAdminForm ? (
          /* ONLY TWO OPTIONS: Google or Admin */
          <div className="space-y-4 pt-1">
            {/* Option 1: Continue with Google */}
            <button
              onClick={googleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60"
            >
              <FcGoogle size={20} />
              {loading ? "Signing in..." : "Continue with Google"}
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                OR
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Option 2: Login as Admin */}
            <button
              onClick={() => setShowAdminForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-xs font-semibold text-[#0D2240] hover:bg-[#0D2240]/5 hover:border-[#0D2240]/30 transition-all duration-200 cursor-pointer"
            >
              <BiShieldQuarter size={16} className="text-[#FB8C00]" />
              Login as Admin
            </button>

            <p className="text-center text-[11px] text-slate-400 pt-2 leading-relaxed">
              By continuing, you agree to Cravely's{" "}
              <span className="text-[#0D2240] font-medium underline underline-offset-2">Terms</span> &{" "}
              <span className="text-[#0D2240] font-medium underline underline-offset-2">Privacy Policy</span>
            </p>
          </div>
        ) : (
          /* Admin Login Form */
          <form onSubmit={handleAdminLogin} className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Admin Security Password
              </label>
              <div className="relative flex items-center">
                <BiLockAlt className="absolute left-3.5 text-slate-400" size={18} />
                <input
                  type="password"
                  placeholder="Enter administrator password"
                  value={adminPassword}
                  autoComplete="new-password"
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3 text-sm outline-none transition focus:border-[#FB8C00] focus:bg-white focus:ring-2 focus:ring-[#FB8C00]/20"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={adminLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-[#0D2240] to-[#163A6B] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#0D2240]/20 hover:from-[#09182E] hover:to-[#0F294D] transition-all cursor-pointer disabled:opacity-50"
            >
              {adminLoading ? "Authenticating..." : "Access Admin Console"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAdminForm(false);
                setAdminPassword("");
              }}
              className="w-full rounded-2xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              ← Back to Google Sign In
            </button>
          </form>
        )}
      </div>

      <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3.5 py-1 text-[11px] font-mono font-medium text-slate-500 shadow-2xs">
        &lt;developed by Maahir Taneja /&gt;
      </span>
    </div>
    </div>
  );
};

export default Login;
