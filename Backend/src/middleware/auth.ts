import AppError from "../utils/appError";
import asyncHandler from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import User from "../model/user";

export const auth = asyncHandler(async (req, res, next) => {
  const accessToken =
    req.cookies.accessToken ||
    req.headers.authorization?.replace("Bearer ", "");
  if (!accessToken) {
    console.log('unauthorized')
    return next(new AppError("Unauthorized", "Unauthorized access", 401));
  }

  console.log('access token',accessToken)

  const decodedUser = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!);


  if (!decodedUser) {
    return next(new AppError("Unauthorized", "Unauthorized access", 401));
  }

  const existingUser=await User.findOne({email:(decodedUser as {email:string}).email})

  if(!existingUser){
    return next(new AppError('Unauthorized','User not found',404))
  }

  req.user = decodedUser as {
    id: string;
    email: string;
  };

  return next()
});

export const protect = asyncHandler(async (req, res, next) => {});
