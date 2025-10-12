import { Request, Response , NextFunction } from "express";
import AppError from "./appError";
import { JsonWebTokenError,TokenExpiredError } from "jsonwebtoken";

const asyncHandler=(handler:(req:Request,res:Response,next:NextFunction)=>Promise<any>)=>{
    return async (req:Request,res:Response,next:NextFunction)=>{
        try {
            await handler(req,res,next)
        } catch (error) {
            if(error instanceof TokenExpiredError){
                return next(new AppError("TokenExpiredError","Token expired", 403));
            }
            if(error instanceof JsonWebTokenError){
                console.log('error',error);
                return next(new AppError("JsonWebTokenError","Invalid token. Try again!", 403));
            }
            next(error as AppError)
        }
    }
}

export default asyncHandler;