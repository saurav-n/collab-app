import { Router } from "express";
import {
  getWorkSpaces,
  createWorkspace,
  getWorkSpaceInviteToken,
  joinWorkspace,
  removeWorkspaceMembers,
  changeMemberRole,
  updateWorkspace,
  deleteWorkspace,
  getWorkSpaceInfo,
  getWorkspaceUser,
  uploadWorkspaceAvatar,
  getUserRole
} from "../controller/workspace";
import upload from "../middleware/multer";
import { auth, protect } from "../middleware/auth";
import {
  isWorkspaceOwner,
  belongsToWorkspace,
  hasInviteToken,
} from "../middleware/workspace";

const router = Router();

router.get("/", auth, getWorkSpaces);
router.get("/:workspaceId", auth,belongsToWorkspace, getWorkSpaceInfo);
router.post("/", auth, upload.single("avatar"), createWorkspace);
router.get(
  "/:workspaceId/invite-token",
  auth,
  belongsToWorkspace,
  getWorkSpaceInviteToken
);
router.patch("/:workspaceId/join", auth, hasInviteToken, joinWorkspace);
router.patch(
  "/:workspaceId/removeMember/:memberId",
  auth,
  isWorkspaceOwner,
  removeWorkspaceMembers
);
router.patch(
  "/:workspaceId/change-role",
  auth,
  isWorkspaceOwner,
  changeMemberRole
);
router.get("/:workspaceId/:userId/getMember", auth, belongsToWorkspace, getWorkspaceUser);
router.patch("/:workspaceId", auth, isWorkspaceOwner, updateWorkspace);
router.delete("/:workspaceId", auth, isWorkspaceOwner, deleteWorkspace);
router.patch("/:workspaceId/avatar", auth, isWorkspaceOwner, upload.single("avatar"), uploadWorkspaceAvatar);
router.get("/:workspaceId/:userId/role", auth, belongsToWorkspace, getUserRole);

export default router;
