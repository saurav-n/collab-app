import { Router } from "express";
import { getWorkSpaceProjects, createProject,getProject,updateProject, deleteProject } from "../controller/project";
import { auth, protect } from "../middleware/auth";
import { isWorkspaceOwner, belongsToWorkspace, isNonGuestMemberOfWorkspace } from "../middleware/workspace";
import { belongsToProject, canModifyProject } from "../middleware/project";

const router = Router();

router.get("/workspace/:workspaceId",auth,belongsToWorkspace,getWorkSpaceProjects);
router.post("/:workspaceId",auth,isNonGuestMemberOfWorkspace,createProject);
router.get("/:projectId",auth,belongsToProject,getProject);
router.patch("/:projectId",auth,canModifyProject,updateProject);
router.delete("/:projectId",auth,canModifyProject,deleteProject);

export default router;