import User from "../model/User.js";
import jwt from "jsonwebtoken";
import TryCatch from "../middlewares/trycatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { oauth2client } from "../config/googleConfig.js";
import axios from "axios";

export const loginUser = TryCatch(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      message: "Authorization code is required",
    });
  }

  const googleRes = await oauth2client.getToken(code);

  oauth2client.setCredentials(googleRes.tokens);

  const userRes = await axios.get(
    `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
  );
  const { email, name, picture } = userRes.data;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      image: picture,
      isAdmin: false,
    });
  }

  const token = jwt.sign({ user }, process.env.JWT_SEC as string, {
    expiresIn: "15d",
  });

  res.status(200).json({
    message: "Logged Success",
    token,
    user,
  });
});

export const loginAsAdmin = TryCatch(async (req, res) => {
  const { password } = req.body as {
    password?: string;
  };

  const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (!password || password !== expectedPassword) {
    return res.status(401).json({
      message: "Invalid admin password",
    });
  }

  // Single admin account
  const adminEmail = "admin@cravely.internal";
  const adminName = "Admin";

  let user = await User.findOne({ email: adminEmail });
  if (!user) {
    user = await User.create({
      name: adminName,
      email: adminEmail,
      image: "https://api.dicebear.com/7.x/identicon/svg?seed=admin",
      role: "admin",
      isAdmin: true,
    });
  } else {
    let changed = false;
    if (user.role !== "admin") {
      user.role = "admin";
      changed = true;
    }
    if (!user.isAdmin) {
      user.isAdmin = true;
      changed = true;
    }
    if (changed) {
      await user.save();
    }
  }

  const token = jwt.sign({ user }, process.env.JWT_SEC as string, {
    expiresIn: "15d",
  });

  res.status(200).json({
    message: "Admin login successful",
    token,
    user,
  });
});

const allowedRoles = ["customer", "rider", "seller", "admin"] as const;
type Role = (typeof allowedRoles)[number];

export const addUserRole = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user?._id) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const { role } = req.body as { role: Role };

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      message: "Invalid role",
    });
  }

  const existingUser = await User.findById(req.user._id);
  if (!existingUser) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  const isAdmin =
    existingUser.isAdmin === true ||
    existingUser.email === "admin@cravely.internal" ||
    existingUser.role === "admin";

  // New users or non-admin users cannot select or become admin
  if (role === "admin" && !isAdmin) {
    return res.status(403).json({
      message: "Forbidden: New users cannot become platform administrators.",
    });
  }

  // Role switching is strictly reserved for administrators
  if (existingUser.role && !isAdmin) {
    return res.status(403).json({
      message: "Role is permanent. Only administrators can switch roles.",
    });
  }

  existingUser.role = role;
  if (role === "admin") {
    existingUser.isAdmin = true;
  }
  await existingUser.save();

  const token = jwt.sign({ user: existingUser }, process.env.JWT_SEC as string, {
    expiresIn: "15d",
  });

  res.json({ user: existingUser, token });
});

export const myProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  res.json(user);
});

export const updateProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user?._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const existingUser = await User.findById(req.user._id);
  if (!existingUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const isAdmin =
    existingUser.isAdmin === true ||
    existingUser.email === "admin@cravely.internal" ||
    existingUser.role === "admin";

  if (isAdmin) {
    return res.status(403).json({
      message: "Admin profile is immutable and cannot be modified",
    });
  }

  const { name } = req.body as { name?: string };
  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Name is required" });
  }

  existingUser.name = name.trim();
  await existingUser.save();

  const token = jwt.sign({ user: existingUser }, process.env.JWT_SEC as string, {
    expiresIn: "15d",
  });

  res.json({ message: "Profile updated successfully", user: existingUser, token });
});

export const deleteAccount = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user?._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const existingUser = await User.findById(req.user._id);
  if (!existingUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const isAdmin =
    existingUser.isAdmin === true ||
    existingUser.email === "admin@cravely.internal" ||
    existingUser.role === "admin";

  if (isAdmin) {
    return res.status(403).json({
      message: "Administrator account cannot be deleted",
    });
  }

  const restaurantService = process.env.RESTAURANT_SERVICE || "http://localhost:5001";
  const riderService = process.env.RIDER_SERVICE || "http://localhost:5005";

  // Clean up restaurant, menu items, addresses, cart
  try {
    await axios.delete(`${restaurantService}/api/restaurant/user/cleanup/${existingUser._id}`);
  } catch (err: any) {
    console.error("Restaurant cleanup error:", err?.message);
  }

  // Clean up rider profile
  try {
    await axios.delete(`${riderService}/api/rider/user/cleanup/${existingUser._id}`);
  } catch (err: any) {
    console.error("Rider cleanup error:", err?.message);
  }

  // Permanently delete user from Auth DB
  await User.findByIdAndDelete(existingUser._id);

  res.json({ message: "Account and all associated records permanently deleted" });
});
