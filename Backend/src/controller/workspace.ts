import asyncHandler from "../utils/asyncHandler";
import Workspace from "../model/workspace";
import AppResponse from "../utils/appResponse";
import uploadImage from "../utils/uploadImage";
import { memoryStorage } from "multer";
import mongoose from "mongoose";
import AppError from "../utils/appError";
import { WorkspaceMember } from "../types/workspace";
import project from "../model/project";
import User from "../model/user";

export const getWorkSpaces = asyncHandler(async (req, res) => {
  console.log(req.user?.id);
  const workspaces = await Workspace.aggregate([
    {
      $match: {
        $or: [
          { owner: new mongoose.Types.ObjectId(req.user?.id) },
          { "members.userId": new mongoose.Types.ObjectId(req.user?.id) },
        ],
      },
    },
    {
      $addFields: {
        isOwner: {
          $eq: ["$owner", new mongoose.Types.ObjectId(req.user?.id)],
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        members: 1,
        avatar: 1,
        isOwner: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new AppResponse(200, "Workspaces retrieved successfully", { workspaces })
    );
});

export const getWorkSpaceInfo = asyncHandler(async (req, res) => {
  const workspaceId = req.params.workspaceId;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new AppError("Not Found", "Workspace not found", 404);
  }

  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(today.getUTCDate()).padStart(2, "0");

  console.log(yyyy, mm, dd);

  const workspaceInfo = await Workspace.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(workspaceId),
      },
    },
    {
      $lookup: {
        from: "projects",
        localField: "_id",
        foreignField: "workspace",
        as: "projects",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerInfo",
        pipeline: [
          {
            $project: {
              password: 0,
              passwordResetToken: 0,
              refreshToken: 0,
              createdAt: 0,
              verificationCode: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "tasks",
        localField: "_id",
        foreignField: "workspace",
        as: "tasks",
        pipeline: [
          {
            $addFields: {
              daysRemaining: {
                $cond: {
                  if: {
                    $gt: [
                      {
                        $floor: {
                          $divide: [
                            {
                              $subtract: [
                                "$dueDate",
                                new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`),
                              ],
                            },
                            86400000,
                          ],
                        },
                      },
                      0,
                    ],
                  },
                  then: {
                    $floor: {
                      $divide: [
                        {
                          $subtract: [
                            "$dueDate",
                            new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`),
                          ],
                        },
                        86400000,
                      ],
                    },
                  },
                  else: 0,
                },
              },
            },
          },
          {
            $lookup: {
              from: "projects",
              localField: "project",
              foreignField: "_id",
              as: "projectName",
              pipeline: [{ $project: { name: 1, _id: 0 } }],
            },
          },
          {
            $addFields: {
              projectName: {
                $arrayElemAt: [
                  {
                    $map: {
                      input: "$projectName",
                      as: "pr",
                      in: "$$pr.name",
                    },
                  },
                  0,
                ],
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalProjects: { $size: "$projects" },
        totalTasks: { $size: "$tasks" },
        completedTasks: {
          $size: {
            $filter: {
              input: "$tasks",
              as: "task",
              cond: { $eq: ["$$task.status", "done"] },
            },
          },
        },
        overDueTasks: {
          $size: {
            $filter: {
              input: "$tasks",
              as: "task",
              cond: {
                $and: [
                  { $eq: ["$$task.status", "in-progress"] },
                  { $lt: ["$$task.dueDate", new Date()] },
                ],
              },
            },
          },
        },
        isOwner: { $eq: ["$owner", new mongoose.Types.ObjectId(req.user?.id)] },
        onGoingTasks: {
          $filter: {
            input: "$tasks",
            as: "task",
            cond: {
              $or: [
                { $eq: ["$$task.status", "in-progress"] },
                { $eq: ["$$task.status", "in-review"] },
              ],
            },
          },
        },
        ownerInfo: {
          $arrayElemAt: ["$ownerInfo", 0],
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        members: 1,
        avatar: 1,
        isOwner: 1,
        projects: 1,
        tasks: 1,
        totalProjects: 1,
        totalTasks: 1,
        completedTasks: 1,
        overDueTasks: 1,
        ownerInfo: 1,
        onGoingTasks: 1,
      },
    },
    {
      $unwind: {
        path: "$members",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "members.userId",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    {
      $unwind: {
        path: "$userInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        "members.userName": "$userInfo.userName",
      },
    },
    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        description: { $first: "$description" },
        avatar: { $first: "$avatar" },
        isOwner: { $first: "$isOwner" },
        projects: { $first: "$projects" },
        tasks: { $first: "$tasks" },
        totalProjects: { $first: "$totalProjects" },
        totalTasks: { $first: "$totalTasks" },
        completedTasks: { $first: "$completedTasks" },
        overDueTasks: { $first: "$overDueTasks" },
        ownerInfo: { $first: "$ownerInfo" },
        onGoingTasks: { $first: "$onGoingTasks" },
        members: { $push: "$members" },
      },
    },
    {
      $addFields: {
        members: {
          $filter: {
            input: "$members",
            as: "member",
            cond: { $gt: [{ $type: "$$member._id" }, "missing"] },
          },
        },
      },
    },
  ]);

  console.log(workspaceInfo);

  return res.status(200).json(
    new AppResponse(200, "Workspace info retrieved successfully", {
      workspace: workspaceInfo[0] ?? {},
    })
  );
});

export const createWorkspace = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    throw new AppError("Bad Request", "Name and description are required", 400);
  }

  console.log("req.file", req.file);

  const avatar = req.file;

  if(!avatar){
    throw new AppError("Bad Request", "Avatar is required", 400);
  }

  console.log("avatar", avatar);

  const uploadResponse = await uploadImage(avatar.path);

  const workspaceAvatar = {
    public_id: uploadResponse.asset_id,
    url: uploadResponse.secure_url,
  };

  console.log(uploadResponse);
  const workspace = await Workspace.create({
    name,
    description,
    owner: req.user?.id,
    avatar: workspaceAvatar,
  });
  return res
    .status(201)
    .json(
      new AppResponse(201, "Workspace created successfully", { workspace })
    );
});

export const getWorkSpaceInviteToken = asyncHandler(async (req, res) => {
  const workspaceId = req.params.workspaceId;
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new AppError("Not Found", "Workspace not found", 404);
  }

  const token = await (workspace as any).generateInviteToken();

  console;

  return res
    .status(200)
    .json(
      new AppResponse(200, "Invite token generated successfully", { token })
    );
});

export const joinWorkspace = asyncHandler(async (req, res) => {
  const workspaceId = req.params.workspaceId;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new AppError("Not Found", "Workspace not found", 404);
  }

  const member = workspace.members.find(
    (member: WorkspaceMember) => member.userId == req.user?.id
  );

  const isOwner = workspace.owner == req.user?.id;

  if (isOwner) {
    throw new AppError("Bad Request", "Owner cannot join workspace", 400);
  }

  if (member) {
    throw new AppError("Bad Request", "Member already exists", 400);
  }

  workspace.members.push({ userId: req.user?.id, role: "guest" });

  await workspace.save();

  return res
    .status(200)
    .json(new AppResponse(200, "Workspace joined sucessfully", { workspace }));
});

export const removeWorkspaceMembers = asyncHandler(async (req, res) => {
  const { memberId } = req.body;

  if (!memberId) {
    throw new AppError("Bad Request", "Member id is required", 400);
  }

  const workspaceId = req.params.workspaceId;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new AppError("Not Found", "Workspace not found", 404);
  }

  const member = workspace.members.find(
    (member: WorkspaceMember) => member.userId == memberId
  );

  if (!member) {
    throw new AppError("Bad Request", "Member not found", 400);
  }

  workspace.members = (workspace.members.filter(
    (member: WorkspaceMember) => member.userId == memberId
  ) != memberId) as any;

  await workspace.save();

  return res.status(200).json(
    new AppResponse(200, "Workspace members removed successfully", {
      workspace,
    })
  );
});

export const changeMemberRole = asyncHandler(async (req, res) => {
  const { memberId, role } = req.body;

  if (!memberId || !role) {
    throw new AppError("Bad Request", "Member id and role are required", 400);
  }

  if (role != "guest" && role != "member") {
    throw new AppError("Bad Request", "Role must be guest or member", 400);
  }

  const workspaceId = req.params.workspaceId;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new AppError("Not Found", "Workspace not found", 404);
  }

  const member = workspace.members.find(
    (member: WorkspaceMember) => member.userId == memberId
  );

  if (!member) {
    throw new AppError("Bad Request", "Member not found", 400);
  }

  member.role = role;

  await workspace.save();

  return res
    .status(200)
    .json(
      new AppResponse(200, "Member role changed successfully", { workspace })
    );
});

export const updateWorkspace = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name && !description) {
    throw new AppError("Bad Request", "Name and description are required", 400);
  }

  const workspaceId = req.params.workspaceId;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new AppError("Not Found", "Workspace not found", 404);
  }

  workspace.name = name;
  workspace.description = description;

  await workspace.save();

  return res
    .status(200)
    .json(
      new AppResponse(200, "Workspace updated successfully", { workspace })
    );
});

export const deleteWorkspace = asyncHandler(async (req, res) => {
  const workspaceId = req.params.workspaceId;

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new AppError("Not Found", "Workspace not found", 404);
  }

  await Workspace.deleteOne({ _id: workspaceId });

  return res
    .status(200)
    .json(new AppResponse(200, "Workspace deleted successfully", {}));
});

export const getWorkspaceUser = asyncHandler(async (req, res) => {
  const { workspaceId, userId } = req.params;

  if (!userId) {
    throw new AppError("Bad Request", "User id is required", 400);
  }

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new AppError("Not Found", "Workspace not found", 404);
  }

  const member = workspace.members.find(
    (member: WorkspaceMember) => member.userId == userId
  );

  const isOwner = workspace.owner == userId;

  if (!member && !isOwner) {
    throw new AppError(
      "Bad Request",
      "User is not a member of the workspace",
      400
    );
  }

  const user = await User.findById(userId).select(
    "-password -verificationCode -passwordResetToken -refreshToken -__v -createdAt -updatedAt"
  );

  if (!user) {
    throw new AppError("Not Found", "User not found", 404);
  }

  return res
    .status(200)
    .json(
      new AppResponse(200, "Workspace users retrieved successfully", { user })
    );
});

export const uploadWorkspaceAvatar = asyncHandler(async (req, res) => {
  console.log('from uploadAvatar')
  const { workspaceId } = req.params;
  console.log("req.file", req.file);
  const avatar = req.file;



  if (!avatar) {
    throw new AppError("Bad Request", "Avatar is required", 400);
  }

  const uploadResponse = await uploadImage(avatar.path);

  const workspaceAvatar = {
    public_id: uploadResponse.asset_id,
    url: uploadResponse.secure_url,
  }; 

  console.log(uploadResponse);
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new AppError("Not Found", "Workspace not found", 404);
  }

  workspace.avatar = workspaceAvatar;

  await workspace.save();

  return res
    .status(200)
    .json(
      new AppResponse(200, "Workspace avatar updated successfully", {
        workspace,
      })
    );
});
