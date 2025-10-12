import AppError from "../utils/appError";
import mongoose from "mongoose";
import { MongoServerError } from "mongodb";
import { Request, Response,NextFunction } from "express";    



const copyError = (err:AppError) => {
  const errorCopy:AppError = {} as AppError;

  // Copy all own property names (enumerable + non-enumerable)
  Object.getOwnPropertyNames(err).forEach((key) => {
    errorCopy[key] = err[key];
  });

  // Optionally include symbol properties (rare in Mongoose errors)
  Object.getOwnPropertySymbols(err).forEach((sym) => {
    (errorCopy as any)[sym] = err[sym];
  });

  errorCopy.name = err.name;

  return errorCopy;
};

const handleCastErrorDB = (err:mongoose.Error.CastError) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(err.name,message, 400);
};

const handleDuplicateFieldsDB = (err:MongoServerError) => {
  const message = `Duplicate field value: ${err.keyValue.name}. Please use another value!`;
  return new AppError(err.name,message, 400);
};

const handleValidationErrorDB = (err:mongoose.Error.ValidationError) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(err.name,message, 400);
};

const handleJwtError = () =>
  new AppError('JsonWebTokenError',"Invalid token. Please login again!", 401);

const handleJWTExpiredError = () =>
  new AppError('TokenExpiredError',"Your token expired. Please login again!", 401);

const sendDevError = (err:AppError, req:Request, res:Response) => {
  res.status(err.status).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};
const sendProdError = (err:AppError, req:Request, res:Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.status).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

const errorHandler = (err:AppError, req:Request, res:Response, next:NextFunction) => {
  err.status = err.status || 500;
  err.message = err.message || "Something went wrong!";

  if (process.env.NODE_ENV === "development") {
    // Development error handling
    sendDevError(err, req, res);
    
  } else if (process.env.NODE_ENV === "production") {
    // Production error handling
    let error = copyError(err);
    if (error.name === "CastError") error = handleCastErrorDB(error as unknown as mongoose.Error.CastError);
    if (error instanceof MongoServerError && error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === "ValidationError") {
      error = handleValidationErrorDB(error as unknown as mongoose.Error.ValidationError);
    }
    if (error.name === "JsonWebTokenError") error = handleJwtError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    //Send Error message to client
    sendProdError(error, req, res);
  }
};

export default errorHandler;
