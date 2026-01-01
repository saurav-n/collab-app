import asyncHandler from "../utils/asyncHandler"
import Project from "../model/project"
import AppResponse from "../utils/appResponse"
import Workspace from "../model/workspace"
import AppError from "../utils/appError"
import mongoose from "mongoose"
import { WorkspaceMember } from "../types/workspace"

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
    const result=await Project.aggregate([
        {$match:{_id:new mongoose.Types.ObjectId(projectId)}},
        {$lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
                {$project:{
                    _id:1,
                    userName:1,
                    email:1
                }}
            ]
        }},
        {$unwind:"$owner"}
    ])


    if(!result){
        throw new AppError("Not Found","Project not found",404)
    }

    return res.status(200).json(new AppResponse(200,"Project retrieved successfully",{project:result[0]}))
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


export const addMembersToProject=asyncHandler(async (req,res)=>{
    const projectId=req.params.projectId
    const members=req.body.members

    if(!members){
        throw new AppError("Bad Request","Members are required",400)
    }

    const project=await Project.findById(projectId)



    console.log('project',project,'type member',typeof project.members) 

    if(!project){
        throw new AppError("Not Found","Project not found",404)
    }

    const workspaceId=project.workspace

    const workspace=await Workspace.findById(workspaceId)

    if(!workspace){
        throw new AppError("Not Found","Workspace not found",404)
    }

    const isWorkspaceOrProjectOwner=members.some((member:string)=>workspace.owner.toString()===member || project.owner.toString()===member)

    if(isWorkspaceOrProjectOwner){
        throw new AppError("Bad request","Cannot add owner",400)
    }

    const isAnyMemberAlreadyInProject=members.some((member:string)=>project.members.includes(new mongoose.Types.ObjectId(member)))

    if(isAnyMemberAlreadyInProject){
        throw new AppError("Bad Request","Members already in project",400)
    }

    const isAnyMemberNotInWorkspace=members.some((member:string)=>!workspace.members.find((m:WorkspaceMember)=>m.userId.toString()===member && m.role==="member"))

    if(isAnyMemberNotInWorkspace){
        throw new AppError("Bad Request","Members not in workspace",400)
    }

    project.members=[...project.members,...members]

    await project.save()

    return res.status(200).json(new AppResponse(200,"Members added successfully",{}))
})

export const deleteProjectMember=asyncHandler(async (req,res)=>{
    const projectId=req.params.projectId
    const memberId=req.params.memberId

    const project=await Project.findById(projectId)

    if(!project){
        throw new AppError("Not Found","Project not found",404)
    }

    const isMemberAlreadyInProject=project.members.includes(new mongoose.Types.ObjectId(memberId))

    if(!isMemberAlreadyInProject){
        throw new AppError("Bad Request","Member not in project",400)
    }

    project.members=project.members.filter((member:string)=>member.toString()!==memberId)

    await project.save()

    return res.status(200).json(new AppResponse(200,"Member deleted successfully",{}))
})


export const getProjectMembers=asyncHandler(async (req,res)=>{
    const projectId=req.params.projectId
    const project=await Project.findById(projectId)

    if(!project){
        throw new AppError("Not Found","Project not found",404)
    }

    const result=await Project.aggregate([
        {$match:{_id:new mongoose.Types.ObjectId(projectId)}},
        {$lookup:{
            from:"users",
            localField:"members",
            foreignField:"_id",
            as:"members"
        }},
        {$unwind:"$members"},
    ])

    const members=result.map((m:any)=>{
       return {
           _id:m.members._id,
           email:m.members.email,
           userName:m.members.userName,
       }
    })

    console.log('member result',members)


    return res.status(200).json(new AppResponse(200,"Project members retrieved successfully",{members}))
})