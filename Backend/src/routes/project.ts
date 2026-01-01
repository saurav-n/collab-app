import { Router } from "express";
import { getWorkSpaceProjects, createProject,getProject,updateProject, deleteProject,addMembersToProject, deleteProjectMember,getProjectMembers } from "../controller/project";
import { auth, protect } from "../middleware/auth";
import { isWorkspaceOwner, belongsToWorkspace, isNonGuestMemberOfWorkspace } from "../middleware/workspace";
import { belongsToProject, canModifyProject } from "../middleware/project";

const router = Router();

router.get("/workspace/:workspaceId",auth,belongsToWorkspace,getWorkSpaceProjects);
router.post("/:workspaceId",auth,isNonGuestMemberOfWorkspace,createProject);
router.get("/:projectId",auth,getProject);
router.patch("/:projectId",auth,canModifyProject,updateProject);
router.delete("/:projectId",auth,canModifyProject,deleteProject);
router.patch("/:projectId/members",auth,canModifyProject,addMembersToProject);
router.delete("/:projectId/members/:memberId",auth,canModifyProject,deleteProjectMember);
router.get("/:projectId/members",auth,belongsToProject,getProjectMembers);

export default router;