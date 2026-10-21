import toast from "react-hot-toast";
import { adminService } from "../main";
import axios from "axios";
import { useState } from "react";

const RiderAdmin = ({
  rider,
  onVerify,
}: {
  rider: any;
  onVerify: () => void;
}) => {
  const [verifying, setVerifying] = useState(false);

  const verify = async () => {
    try {
      setVerifying(true);
      await axios.patch(
        `${adminService}/api/v1/verify/rider/${rider._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Rider verified successfully 🎉");
      onVerify();
    } catch (error) {
      toast.error("Failed to verify rider");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-xs border border-gray-100 space-y-3">
      {rider.picture && (
        <img
          src={rider.picture}
          className="h-44 w-full object-cover rounded-xl"
          alt="Rider document"
        />
      )}

      <div className="space-y-1">
        <h3 className="font-bold text-gray-800 text-base">
          Phone: {rider.phoneNumber}
        </h3>
        <p className="text-xs text-gray-600">
          <strong className="text-gray-700">Aadhar:</strong> {rider.aadharNumber}
        </p>
        <p className="text-xs text-gray-600">
          <strong className="text-gray-700">Driving License:</strong>{" "}
          {rider.drivingLicenseNumber}
        </p>
      </div>

      <button
        disabled={verifying}
        className="w-full rounded-xl bg-green-600 py-2.5 text-xs font-semibold text-white hover:bg-green-700 transition cursor-pointer shadow-xs disabled:opacity-50"
        onClick={verify}
      >
        {verifying ? "Verifying..." : "Approve & Verify Rider"}
      </button>
    </div>
  );
};

export default RiderAdmin;
