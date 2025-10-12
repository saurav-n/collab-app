// types/express/index.d.ts (create this file if it doesn’t exist)
import { Request } from "express";
import File from "../file";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
    }
    files?: File[];
    file?: File;
  }
}
