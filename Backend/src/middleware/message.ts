import Message from "../model/message";
import asyncHandler from "../utils/asyncHandler";

export const isMsgOwner =asyncHandler(async (req,res,next)=>{
    const {messageId}=req.params;
    const message = await Message.findById(messageId);
    if(!message){
        return res.status(404).json({ok:false,error:'Message not found'});
    }
    if(message.senderId.toString() !== req.user?.id.toString()){
        return res.status(403).json({
            success:false,
            error:'You are not the owner of this message'
        });
    }
    next();
})