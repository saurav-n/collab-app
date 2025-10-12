class AppError extends Error {
    [key: string]: any;
    [sym: symbol]: any;
    status: number;
    isOperational: boolean;
  
    constructor(name: string, message: string, status: number, isOperational = true) {
      super(message);
  
      this.name = name;
      this.status = status;
      this.isOperational = isOperational;
  
      // maintain proper stack trace (only available in V8 environments like Node.js/Chrome)
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export default AppError;
  