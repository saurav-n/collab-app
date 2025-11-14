import asyncHandler from "../utils/asyncHandler"
import Project from "../model/project"
import AppResponse from "../utils/appResponse"
import Workspace from "../model/workspace"
import AppError from "../utils/appError"

export const getWorkSpaceProjects=asyncHandler(async (req,res)=>{
    const workspaceId=req.params.workspaceId
    const workspace=await Workspace.findById(workspaceId)

    if(!workspace){
        throw new AppError("Not Found","Workspace not found",404)
    }

    const projects=await Project.find({workspace:workspaceId})

    return res.status(200).json(new AppResponse(200,"Projects retrieved successfully",{projects}))
})

export const createProject=asyncHandler(async (req,res)=>{
    const {name,description}=req.body

    const workspaceId=req.params.workspaceId

    if(!name || !description || !workspaceId){
        throw new AppError("Bad Request","Name, description and workspace id are required",400)
    }

    const workspace=await Workspace.findById(workspaceId)

    if(!workspace){
        throw new AppError("Not Found","Workspace not found",404)
    }

    console.log(req.user?.id)

    const project=await Project.create({name,description,workspace:workspaceId,owner:req.user?.id})

    return res.status(201).json(new AppResponse(201,"Project created successfully",{project}))
})

export const getProject=asyncHandler(async (req,res)=>{
    const projectId=req.params.projectId
    const project=await Project.findById(projectId)

    if(!project){
        throw new AppError("Not Found","Project not found",404)
    }

    return res.status(200).json(new AppResponse(200,"Project retrieved successfully",{project}))
})

export const updateProject=asyncHandler(async (req,res)=>{
    const {name,description}=req.body

    const projectId=req.params.projectId

    if(!name && !description){
        throw new AppError("Bad Request","Name and description are required",400)
    }

    const project=await Project.findById(projectId)

    if(!project){
        throw new AppError("Not Found","Project not found",404)
    }

    project.name=name
    project.description=description

    await project.save()

    return res.status(200).json(new AppResponse(200,"Project updated successfully",{project}))
})

export const deleteProject=asyncHandler(async (req,res)=>{
    const projectId=req.params.projectId

    const project=await Project.findById(projectId)

    if(!project){
        throw new AppError("Not Found","Project not found",404)
    }

    await Project.deleteOne({_id:projectId})

    return res.status(200).json(new AppResponse(200,"Project deleted successfully",{}))
})