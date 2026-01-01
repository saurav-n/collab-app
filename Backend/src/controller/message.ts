import { parse } from "dotenv";
import Message from "../model/message";
import asyncHandler from "../utils/asyncHandler";
import { mongo, Mongoose } from "mongoose";
import AppResponse from "../utils/appResponse";
import AppError from "../utils/appError";

export const deleteMessage = asyncHandler(async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findByIdAndDelete(messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: "Message not found" });
    }
    return res.status(200).json(new AppResponse(200, "Message deleted successfully", { message }));
  } catch (error) {
    return res.status(500).json(new AppError("Internal Server Error", (error as Error).message, 500));
  }
});

export const editMessage = asyncHandler(async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const message = await Message.findByIdAndUpdate(messageId, {
      content,
    });
    if (!message) {
      return res.status(404).json({ success: false, error: "Message not found" });
    }
    return res.status(200).json(new AppResponse(200, "Message edited successfully", { message }));
  } catch (error) {
    return res.status(500).json(new AppError("Internal Server Error", (error as Error).message, 500));
  }
});

export const getProjectMessages = asyncHandler(async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ success: false, error: "Project id is required" });
    }
    const page= req.query.page  || 1
    const result = await Message.aggregatePaginate([
        {
            $match: {
                project: new mongo.ObjectId(projectId)
            }
        },
        {$lookup:{
            from:"users",
            localField:"senderId",
            foreignField:"_id",
            as:"sender",
            pipeline:[
              {$project:{
                _id:1,
                userName:1,
                email:1
              }}
            ]
          }},
          {$unwind:"$sender"}
    ],{
        page:parseInt(page as string),
        limit:25,
        sort:{
            createdAt:-1
        }
    });
    const {docs,...paginateData}=result
    return res.status(200).json(new AppResponse(200, "Messages retrieved successfully", { messages: docs, paginateData }));
  } catch (error) {
    return res.status(500).json(new AppError("Internal Server Error", (error as Error).message, 500));
  }
});