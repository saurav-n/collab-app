import { Router } from "express";
import { register, verifyCode, resendCode, login, getPasswordResetToken, resetPassword, logout,refreshAccessToken, getMe } from "../controller/auth";
import { auth } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/verify-code", verifyCode);
router.post("/resend-code", resendCode);
router.post("/login", login);
router.get("/get-password-reset-token/:email", getPasswordResetToken);
router.post("/reset-password", resetPassword);
router.post("/logout",auth, logout);
router.get('/me',auth,getMe);
router.post('/refresh-access-token',refreshAccessToken);

export default router;