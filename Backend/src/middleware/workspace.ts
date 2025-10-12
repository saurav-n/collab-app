import asyncHandler from "../utils/asyncHandler";
import Workspace from "../model/workspace";
import AppError from "../utils/appError";
import jwt from "jsonwebtoken";
import { WorkspaceMember } from "../types/workspace";

export const isWorkspaceOwner=asyncHandler(async (req,res,next)=>{
    const workspaceId=req.params.workspaceId
    const workspace=await Workspace.findById(workspaceId)

    if(!workspace){
        throw new AppError("Not Found","Workspace not found",404)
    }

    if(workspace.owner!=req.user?.id){
        throw new AppError("Unauthorized","Unauthorized access",401)
    }

    return next()
})

export const belongsToWorkspace=asyncHandler(async (req,res,next)=>{
    const workspaceId=req.params.workspaceId
    const workspace=await Workspace.findById(workspaceId)

    if(!workspace){
        throw new AppError("Not Found","Workspace not found",404)
    }
    

    if(!workspace.members.find((member:WorkspaceMember)=>member.userId==req.user?.id) && workspace.owner!=req.user?.id){
        throw new AppError("Unauthorized","Unauthorized access",401)
    }

    return next()
})

export const hasInviteToken=asyncHandler(async (req,res,next)=>{
    const workspaceId=req.params.workspaceId
    const {inviteToken}=req.body

    if(!inviteToken){
        throw new AppError("Bad Request","Invite token is required",400)
    }
    
    const workspace=await Workspace.findById(workspaceId)

    if(!workspace){
        throw new AppError("Not Found","Workspace not found",404)
    }

    jwt.verify(inviteToken,process.env.INVITE_TOKEN_SECRET!)

    const tokenStatus=(workspace as any).isTokenValid(inviteToken)

    if(tokenStatus==2 || tokenStatus==0){
        throw new AppError("Unauthorized","Token not found",401)
    }
    
    if(tokenStatus==-1){
        throw new AppError("Unauthorized","Token expired",401)
    }

    return next()
})

export const isNonGuestMemberOfWorkspace=asyncHandler(async (req,res,next)=>{
    const workspaceId=req.params.workspaceId

    const workspace=await Workspace.findById(workspaceId)

    if(!workspace){
        throw new AppError("Not Found","Workspace not found",404)
    }

    if(!workspace.members.find((member:WorkspaceMember)=>member.userId==req.user?.id) && workspace.owner!=req.user?.id){
        throw new AppError("Unauthorized","Unauthorized access",401)
    }

    if(workspace.members.find((member:WorkspaceMember)=>member.userId==req.user?.id && member.role=="guest")){
        throw new AppError("Unauthorized","Unauthorized access",401)
    }

    return next()
})