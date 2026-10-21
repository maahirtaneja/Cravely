import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ProtectedRoute from "./components/protectedRote";
import PublicRoute from "./components/publicRoute";
import SelectRole from "./pages/SelectRole";
import Navbar from "./components/navbar";
import { useAppData } from "./context/AppContext";
import Restaurant from "./pages/Restaurant";
import RestaurantPage from "./pages/RestaurantPage";
import Cart from "./pages/Cart";
import AddAddressPage from "./pages/Address";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import OrderPage from "./pages/OrderPage";
import RiderDashboard from "./pages/RiderDashboard";
import Admin from "./pages/Admin";

const App = () => {
  const { user, loading } = useAppData();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#FB8C00] border-t-transparent" />
        <h1 className="text-xl font-extrabold text-[#0D2240] tracking-tight">
          Cravel<span className="text-[#FB8C00]">y</span>
        </h1>
      </div>
    );
  }

  const renderDashboardOrHome = () => {
    if (!user) return <Home />;
    if (user.role === "seller") return <Restaurant />;
    if (user.role === "rider") return <RiderDashboard />;
    if (user.role === "admin") return <Admin />;
    return (
      <>
        <Navbar />
        <Home />
      </>
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={renderDashboardOrHome()} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/account" element={<Navigate to="/" replace />} />
          <Route
            path="/orders"
            element={
              <>
                <Navbar />
                <Orders />
              </>
            }
          />
          <Route
            path="/order/:id"
            element={
              <>
                <Navbar />
                <OrderPage />
              </>
            }
          />
          <Route
            path="/ordersuccess"
            element={
              <>
                <Navbar />
                <OrderSuccess />
              </>
            }
          />
          <Route
            path="/address"
            element={
              <>
                <Navbar />
                <AddAddressPage />
              </>
            }
          />
          <Route
            path="/checkout"
            element={
              <>
                <Navbar />
                <Checkout />
              </>
            }
          />
          <Route
            path="/restaurant/:id"
            element={
              <>
                <Navbar />
                <RestaurantPage />
              </>
            }
          />
          <Route
            path="/cart"
            element={
              <>
                <Navbar />
                <Cart />
              </>
            }
          />
          <Route
            path="/paymentsuccess/:paymentId"
            element={
              <>
                <Navbar />
                <PaymentSuccess />
              </>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
