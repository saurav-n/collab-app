import asyncHandler from "../utils/asyncHandler";
import Project from "../model/project"; 
import AppError from "../utils/appError";
import Workspace from "../model/workspace";
import { WorkspaceMember } from "../types/workspace";

export const isProjectOwner=asyncHandler(async (req,res,next)=>{
    const projectId=req.params.projectId
    const project=await Project.findById(projectId)

    if(!project){
        throw new AppError("Not Found","Project not found",404)
    }

    if(project.owner!=req.user?.id){
        throw new AppError("Unauthorized","Unauthorized access",401)
    }

    return next()
})

export const belongsToProject=asyncHandler(async (req,res,next)=>{
    const projectId=req.params.projectId
    const project=await Project.findById(projectId)

    if(!project){
        throw new AppError("Not Found","Project not found",404)
    }

    const workspaceId=project.workspace

    const workspace=await Workspace.findById(workspaceId)

    if(!workspace){
        throw new AppError("Not Found","Workspace not found",404)
    }
    

    if(!workspace.members.find((member:WorkspaceMember)=>member.userId==req.user?.id) && project.owner!=req.user?.id && workspace.owner!=req.user?.id){
        throw new AppError("Unauthorized","Unauthorized access",401)
    }

    return next()
})

export const canModifyProject=asyncHandler(async (req,res,next)=>{
    const projectId=req.params.projectId
    const project=await Project.findById(projectId)

    if(!project){
        throw new AppError("Not Found","Project not found",404)
    }

    if(project.owner==req.user?.id){
        return next()
    }

    const workspaceId=project.workspace

    const workspace=await Workspace.findById(workspaceId)

    if(!workspace){
        throw new AppError("Not Found","Workspace not found",404)
    }
    
    if(workspace.owner!=req.user?.id){
        throw new AppError("Unauthorized","Unauthorized access",401)
    }

    return next()
})