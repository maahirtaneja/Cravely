import express from "express";
import {
  addUserRole,
  loginUser,
  myProfile,
  loginAsAdmin,
  updateProfile,
  deleteAccount,
} from "../controllers/auth.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/admin/login", loginAsAdmin);
router.put("/add/role", isAuth, addUserRole);
router.get("/me", isAuth, myProfile);
router.put("/profile/update", isAuth, updateProfile);
router.delete("/account/delete", isAuth, deleteAccount);

export default router;
