import asyncHandler from "../utils/asyncHandler";
import Task from "../model/task";
import AppError from "../utils/appError";
import AppResponse from "../utils/appResponse";
import mongoose from "mongoose";
import User from "../model/user";
import Project from "../model/project";
import Workspace from "../model/workspace";
import { WorkspaceMember } from "../types/workspace";
import { Request,Response } from "express";

export const createTask = asyncHandler(async (req, res) => {
  const { name, description, dueDate, assigneeId, projectId } = req.body;

  console.log(req.body);
  if (
    [name, description, dueDate, assigneeId, projectId].some(
      (v) => v === undefined
    )
  ) {
    throw new AppError(
      "Bad Request",
      "Please provide all required fields",
      400
    );
  }

  const workspaceId = req.params.workspaceId;
  const ownerId = req.user?.id;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new AppError("Bad Request", "Invalid workspace", 400);
  }

  const user = await User.findById(assigneeId);

  if (!user) {
    throw new AppError("Bad Request", "Invalid assignee", 400);
  }

  if (
    workspace.owner != assigneeId &&
    !workspace.members.find(
      (member: WorkspaceMember) =>
        member.userId == assigneeId && member.role != "guest"
    )
  ) {
    throw new AppError(
      "Bad Request",
      "Assignee must be a member of the workspace",
      400
    );
  }

  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError("Bad Request", "Invalid project", 400);
  }
  if (
    !new Date(dueDate).getTime() ||
    isNaN(new Date(dueDate).getTime()) ||
    !isFinite(new Date(dueDate).getTime()) ||
    new Date(dueDate).toString() === "Invalid Date"
  ) {
    throw new AppError("Bad Request", "Invalid dueDate", 400);
  }

  const task = await Task.create({
    name,
    description,
    dueDate: new Date((dueDate as string) + "T00:00:00Z"),
    assignee: assigneeId
      ? new mongoose.Types.ObjectId(assigneeId as string)
      : null,
    project: projectId
      ? new mongoose.Types.ObjectId(projectId as string)
      : null,
    workspace: workspaceId,
    owner: ownerId,
  });

  res
    .status(201)
    .json(new AppResponse(201, "Task created successfully", { task }));
});

export const getTask = asyncHandler(async (req, res) => {
  const taskId = req.params.taskId;
  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError("Not Found", "Task not found", 404);
  }

  res
    .status(200)
    .json(new AppResponse(200, "Task found successfully", { task }));
});

export const updateTask = asyncHandler(async (req, res) => {
  const taskId = req.params.taskId;
  const { name, description, dueDate, assigneeId, projectId } = req.body;

  if (
    [name, description, dueDate, assigneeId, projectId].some(
      (v) => v === undefined
    )
  ) {
    return res
      .status(400)
      .json(
        new AppError("Bad Request", "Please provide all required fields", 400)
      );
  }

  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError("Not Found", "Task not found", 404);
  }

  const user = await User.findById(assigneeId);

  if (!user) {
    throw new AppError("Bad Request", "Invalid assignee", 400);
  }

  const workspace = await Workspace.findById(task.workspace);

  if (!workspace) {
    throw new AppError("Bad Request", "Invalid workspace", 400);
  }

  if (
    workspace.owner != assigneeId &&
    !workspace.members.find(
      (member: WorkspaceMember) =>
        member.userId == assigneeId && member.role != "guest"
    )
  ) {
    throw new AppError(
      "Bad Request",
      "Assignee must be a member of the workspace",
      400
    );
  }

  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError("Bad Request", "Invalid project", 400);
  }

  if (
    !new Date(dueDate).getTime() ||
    isNaN(new Date(dueDate).getTime()) ||
    !isFinite(new Date(dueDate).getTime()) ||
    new Date(dueDate).toString() === "Invalid Date"
  ) {
    throw new AppError("Bad Request", "Invalid dueDate", 400);
  }

  task.name = name;
  task.description = description;
  task.dueDate = new Date((dueDate as string) + "T00:00:00Z");
  task.assignee = assigneeId
    ? new mongoose.Types.ObjectId(assigneeId as string)
    : null;
  task.project = projectId
    ? new mongoose.Types.ObjectId(projectId as string)
    : null;

  await task.save();

  res
    .status(200)
    .json(new AppResponse(200, "Task updated successfully", { task }));
});

export const deleteTask = asyncHandler(async (req, res) => {
  const taskId = req.params.taskId;
  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError("Not Found", "Task not found", 404);
  }
  await Task.findByIdAndDelete(taskId);

  res
    .status(200)
    .json(new AppResponse(200, "Task deleted successfully", { task }));
});

export const getWorkspaceTasks = asyncHandler(async (req, res) => {
  const workspaceId = req.params.workspaceId;

  const match: any = { workspace: new mongoose.Types.ObjectId(workspaceId) };

  const {
    status,
    assignee,
    dueDate,
    project,
    sortBy,
    limit = 10,
    page = 1,
  } = req.query;

  if (
    status &&
    !["backlog", "todo", "in-progress", "in-review", "done"].includes(
      status as string
    )
  ) {
    throw new AppError("Bad Request", "Invalid status value", 400);
  }

  if (project) {
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      throw new AppError("Bad Request", "Invalid project", 400);
    }
    match.project = new mongoose.Types.ObjectId(project as string);
  }

  if (sortBy && !["newest", "oldest"].includes(sortBy as string)) {
    throw new AppError("Bad Request", "Invalid sortBy value", 400);
  }

  if (status) {
    match.status = status;
  }

  if (assignee) {
    match.assignee = new mongoose.Types.ObjectId(assignee as string);
  }

  if (
    dueDate &&
    typeof dueDate === "string" &&
    new Date(dueDate).toString() === "Invalid Date"
  ) {
    console.log(new Date(dueDate as string).toString());
    throw new AppError("Bad Request", "Invalid dueDate", 400);
  }

  if (dueDate) {
    console.log(dueDate);
    const date = new Date((dueDate as string) + "T00:00:00Z");
    console.log(date);
    match.dueDate = { $lte: date };
  }

  const paginateOptions = {
    page: parseInt(page as string, 10),
    limit: parseInt(limit as string, 10),
  };

  console.log(match);

  const result = await Task.aggregatePaginate(
    [
      {
        $match: match,
      },
      {
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "projectDetail",
          pipeline: [
            {
              $project: { name: 1 },
            },
          ],
        },
      },
      {
        $unwind: "$projectDetail",
      },
      {
        $lookup: {
          from: "users",
          localField: "assignee",
          foreignField: "_id",
          as: "assigneeDetail",
          pipeline: [
            {
              $project: { userName: 1, email: 1 },
            },
          ],
        },
      },
      {
        $unwind: "$assigneeDetail",
      },
      {
        $sort: sortBy === "oldest" ? { createdAt: 1 } : { createdAt: -1 },
      },
    ],
    paginateOptions
  );

  const { docs, ...paginateData } = result;

  res.status(200).json(
    new AppResponse(200, "Tasks retrieved successfully", {
      tasks: docs,
      paginateData,
    })
  );
});

export const changeTaskStatus = asyncHandler(async (req, res) => {
  const taskId = req.params.taskId;
  const { status } = req.body;

  console.log("from changeTaskStatus:", req.body);

  if (!status) {
    throw new AppError("Bad Request", "Status is required", 400);
  }

  if (
    !["backlog", "todo", "in-progress", "in-review", "done"].includes(status)
  ) {
    throw new AppError("Bad Request", "Invalid status value", 400);
  }
  const task = await Task.findById(taskId);

  if (!task) {
    return res
      .status(404)
      .json(new AppError("Not Found", "Task not found", 404));
  }

  console.log("Updating status to:",task._id,status);

  task.status = status;

  await task.save();

  res
    .status(200)
    .json(new AppResponse(200, "Task status changed successfully", { task }));
});

// export const changeTaskStatus = (request: Request, response: Response) => {
//   setTimeout(()=>{
//     const taskId = request.params.taskId;
//     const { status } = request.body;

//     console.log("from changeTaskStatus:", request.body);

//     if (!status) {
//       throw new AppError("Bad Request", "Status is required", 400);
//     }

//     if (
//       !["backlog", "todo", "in-progress", "in-review", "done"].includes(status)
//     ) {
//       response.status(400).json(new AppError("Bad Request", "Invalid status value", 400));
//     }
//     Task.findById(taskId).then((task) => {
//       if (!task) {
//         return response
//           .status(404)
//           .json(new AppError("Not Found", "Task not found", 404));
//       }

//       console.log("Updating status to:",task._id,status);

//       task.status = status;

//       task.save().then(()=>{
//         response
//           .status(200)
//           .json(new AppResponse(200, "Task status changed successfully", { task }));
//       })
//     })
//   },1000)
// }
