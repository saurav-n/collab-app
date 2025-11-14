import e, { CookieOptions, NextFunction, Request, Response } from "express";
import User from "../model/user";
import AppError from "../utils/appError";
import asyncHandler from "../utils/asyncHandler";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/sendMail";
import jwt from "jsonwebtoken";
import AppResponse from "../utils/appResponse";

export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userName, email, password } = req.body;
    if (!userName || !email || !password) {
      throw new AppError("Invalid params", "Please provide all fields", 400);
    }
    const existingUser = await User.findOne({ $or: [{ email }, { userName }] });
    if (existingUser) {
      throw new AppError(
        "Invalid params",
        "User with this email or username already exists",
        400
      );
    }
    const user = await User.create({ userName, email, password });

    const verificationCode = await (user as any).generateVerificationCode();

    const emailResponse = await sendVerificationEmail(email, verificationCode);

    console.log(emailResponse);

    if (emailResponse) {
      return res
        .status(201)
        .json(new AppResponse(201,"User registered successfully,",{}));
    } else {
      throw new AppError(
        "Email Error",
        "Failed to send verification email",
        500
      );
    }
  }
);

export const verifyCode = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { code, email } = req.body;
    if (!code || !email) {
      throw new AppError(
        "Invalid params",
        "Please provide a verification code and email",
        400
      );
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError("Invalid params", "User not found", 400);
    }

    const codeStatus = (user as any).isCodeValid(code);

    if (codeStatus === 2) {
      throw new AppError(
        "Invalid params",
        "Verification code has expired",
        400
      );
    }
    if (codeStatus === 0) {
      throw new AppError("Invalid params", "Invalid verification code", 400);
    }
    user.isVerified = true;
    await user.save();
    return res.status(200).json({ message: "User verified successfully" });
  }
);

export const resendCode = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    if (!email) {
      throw new AppError("Invalid params", "Please provide an email", 400);
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError("Invalid params", "User not found", 400);
    }

    const verificationCode = await (user as any).generateVerificationCode();

    const emailResponse = await sendVerificationEmail(email, verificationCode);

    console.log(emailResponse);

    if (emailResponse) {
      return res
        .status(200)
        .json({ message: "Verification email sent successfully" });
    } else {
      throw new AppError(
        "Email Error",
        "Failed to send verification email",
        500
      );
    }
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, userName } = req.body;
    if (!email && !userName) {
      throw new AppError(
        "Invalid params",
        "Please provide email or user name",
        400
      );
    }
    if (!password) {
      throw new AppError("Invalid params", "Please provide password", 400);
    }
    const user = await User.findOne({ $or: [{ email }, { userName }] });
    if (!user) {
      throw new AppError("Invalid params", "User not found", 400);
    }

    if(!user.isVerified){
      throw new AppError("Invalid params", "User not verified", 400);
    }

    const isPasswordValid = await (user as any).comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError("Invalid params", "Invalid email or password", 400);
    }
    const { accessToken, refreshToken } = await (
      user as any
    ).generateAuthTokens();

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 30 * 1000,
      sameSite: "strict",
      domain: "localhost",
      path: "/",
    };

    return res
      .cookie("accessToken", accessToken, cookieOptions as CookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions as CookieOptions)
      .status(200)
      .json(new AppResponse(200,"Login successful",{ accessToken, refreshToken }));
  }
);

export const getPasswordResetToken= asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.params
    if (!email) {
      throw new AppError("Invalid params", "Please provide an email", 400);
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError("Invalid params", "User not found", 400);
    }

    if(!user.isVerified){
      throw new AppError("Invalid params", "User not verified", 400);
    }

    const passwordResetToken = await (user as any).generatePasswordResetToken();

    const emailResponse = await sendPasswordResetEmail(email, passwordResetToken);

    if (emailResponse) {
      return res
        .status(200)
        .json(new AppResponse(200,"Password reset email sent successfully",{}));
    } else {
      throw new AppError(
        "Email Error",
        "Failed to send password reset email",
        500
      );
    }
  }
);

export const resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    throw new AppError(
      "Invalid params",
      "Please provide a password reset token and password",
      400
    );
  }
  console.log('pw r token',process.env.NODE_ENV);
  console.log('token',token);
  jwt.verify(token,process.env.PASSWORD_RESET_TOKEN_SECRET!);
  const user = await User.findOne({ passwordResetToken: token });
  if (!user) {
    throw new AppError("Invalid params", "Password reset token not found", 400);
  }


  user.password = newPassword;
  await user.save();
  return res.status(200).json(new AppResponse(200,"Password reset successfully",{}));
});

export const logout = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req
    const foundUser = await User.findById(user?.id);
    if (!foundUser) {
      throw new AppError("Invalid params", "User not found", 400);
    }
    foundUser.refreshToken = '';
    await foundUser.save();


    return res.clearCookie('accessToken').clearCookie('refreshToken').status(200).json({ message: "Logged out successfully" });
  }
);


export const refreshAccessToken=asyncHandler(async (req,res,next)=>{
  const refreshToken=req.cookies.refreshToken || req.headers.authorization?.replace('Bearer','')

  if(!refreshToken){
    throw new AppError('Unauthorized','Please provide token',401)
  }

  const decodedUser=jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET!)

  const user=await User.findById((decodedUser as {id:string}).id)

  if(!user){
    throw new AppError('Invalid params','User not found',404)
  }

  console.log(user)

  if(String(refreshToken)!==user.refreshToken){
    throw new AppError('JsonWebTokenError','Token mismatched',400)
  }

  const accessToken=await (user as any).getAccessToken()

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 30 * 1000,
    sameSite: "strict",
    domain: "localhost",
    path: "/",
  };

  return res.cookie('accessToken',accessToken,cookieOptions as CookieOptions).status(200).json({message:"Token refreshed successfully"});
})

export const getMe=asyncHandler(async (req:Request,res:Response,next:NextFunction)=>{
  const {user}=req
  const foundUser=await User.findById(user?.id).select('-password -verificationCode -passwordResetToken -refreshToken -__v -createdAt -updatedAt')
  if(!foundUser){
    throw new AppError('Invalid params','User not found',404)
  }
  return res.status(200).json(new AppResponse(200,'User found successfully',foundUser))
})