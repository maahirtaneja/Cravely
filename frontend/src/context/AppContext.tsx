import axios from "axios";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService, restaurantService } from "../main";
import type { AppContextType, ICart, LocationData, User } from "../types";
import { Toaster } from "react-hot-toast";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

const DEFAULT_LOCATION: LocationData = {
  latitude: 26.828,
  longitude: 75.789,
  formattedAddress: "Tonk Road, Jaipur, Rajasthan",
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const [location, setLocation] = useState<LocationData | null>(DEFAULT_LOCATION);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [city, setCity] = useState("Jaipur");

  async function fetchUser() {
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.get(`${authService}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(data);
      setIsAuth(true);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const [cart, setCart] = useState<ICart[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [quauntity, setQuauntity] = useState(0);

  async function fetchCart() {
    if (!user || user.role !== "customer") return;
    try {
      const { data } = await axios.get(`${restaurantService}/api/cart/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setCart(data.cart || []);
      setSubTotal(data.subtotal || 0);
      setQuauntity(data.cartLength);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user && user.role === "customer") {
      fetchCart();
    }
  }, [user]);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    setLoadingLocation(true);

    const geoOptions: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 3000,
      maximumAge: 300000,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Immediately update coordinates so nearby restaurants load with real distance
        setLocation((prev) => ({
          latitude,
          longitude,
          formattedAddress: prev?.formattedAddress || "Your Current Location",
        }));
        setLoadingLocation(false);

        // Fetch friendly address string asynchronously with a fast timeout
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2500);

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { signal: controller.signal }
          );
          clearTimeout(timer);

          if (res.ok) {
            const data = await res.json();
            setLocation({
              latitude,
              longitude,
              formattedAddress: data.display_name || "Current Location",
            });

            const cityName =
              data.address?.city ||
              data.address?.town ||
              data.address?.suburb ||
              data.address?.village ||
              data.address?.state_district ||
              "Jaipur";
            setCity(cityName);
          }
        } catch {
          // Keep current coordinates
        }
      },
      (error) => {
        // Geolocation denied, prompt ignored, or timeout (e.g. Safari Private Mode)
        console.warn("Geolocation fallback used:", error.message);
        setLoadingLocation(false);
      },
      geoOptions
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        isAuth,
        loading,
        setIsAuth,
        setLoading,
        setUser,
        user,
        location,
        loadingLocation,
        city,
        cart,
        fetchCart,
        quauntity,
        subTotal,
      }}
    >
      {children}

      <Toaster />
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used within AppProvider");
  }
  return context;
};
