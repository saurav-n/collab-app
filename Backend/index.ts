import dotenv from "dotenv";
dotenv.config({path:"./.env"});
import mongoose from "mongoose";
import app from "./app";


const startServer=async ()=>{
  try {
    await mongoose.connect(process.env.db_connection_string!);
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT || 8000}`); 
      console.log(process.env.db_connection_string);
      
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

startServer();