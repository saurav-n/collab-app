import cloudinary from "../lib/cloudinary";
import fs from "fs";

const uploadImage=async (file:string)=>{
    try {
        const result=await cloudinary.uploader.upload(file,{
            folder:"uploads",
            use_filename:true
        })
        return result
    } catch (error) {
        console.log('uploadImage error',error)
        throw error
    }finally{
        fs.unlink(file,(err)=>{
            if(err){
                console.log('unlink error',err)
            }
        })
    }
}

export default uploadImage