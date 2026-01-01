import asyncHandler from "../utils/asyncHandler";
import Task from "../model/task";
import AppError from "../utils/appError";
import Workspace from "../model/workspace";
import Project from "../model/project";
import mongoose from "mongoose";

export const canModifyTask = asyncHandler(async (req, res, next) => {
  const taskId = req.params.taskId;

  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError("Not Found", "Task not found", 404);
  }

  const workspaceId = task.workspace;
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new AppError("Not Found", "Workspace not found", 404);
  }

  const workspaceOwner = workspace.owner;

  const projectId = task.project;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError("Not Found", "Project not found", 404);
  }

  const projectOwner = project.owner;

  console.log({
    workspaceOwner,
    projectOwner,
    taskOwner: task.owner,
    reqUser: req.user?.id,
  });

  if (
    ![
      (workspaceOwner as mongoose.Types.ObjectId).toString(),
      (projectOwner as mongoose.Types.ObjectId).toString(),
      (task.owner as mongoose.Types.ObjectId).toString(),
    ].includes(req.user?.id!)
  ) {
    throw new AppError("Unauthorized", "Unauthorized access", 401);
  }

  return next();
});

export const belongsToTask = asyncHandler(async (req, res, next) => {
  const taskId = req.params.taskId;

  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError("Not Found", "Task not found", 404);
  }

  const workspaceId = task.workspace;
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new AppError("Not Found", "Workspace not found", 404);
  }

  const workspaceOwner = workspace.owner;

  const projectId = task.project;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError("Not Found", "Project not found", 404);
  }

  const projectOwner = project.owner;

  if (
    ![
      (workspaceOwner as mongoose.Types.ObjectId).toString(),
      (projectOwner as mongoose.Types.ObjectId).toString(),
      (task.owner as mongoose.Types.ObjectId).toString(),
      (task.assignee as mongoose.Types.ObjectId).toString(),
    ].includes(req.user?.id!)
  ) {
    throw new AppError("Unauthorized", "Unauthorized access", 401);
  }


  return next();
});

