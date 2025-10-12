import { Router } from "express";
import { createTask, getTask, updateTask, deleteTask, getWorkspaceTasks, changeTaskStatus } from "../controller/task";
import { belongsToWorkspace, isNonGuestMemberOfWorkspace } from "../middleware/workspace";
import { auth } from "../middleware/auth";  
import { belongsToTask,canModifyTask } from "../middleware/task";

const router = Router();


router.post("/workspace/:workspaceId",auth,isNonGuestMemberOfWorkspace,createTask);
router.get("/workspace/:workspaceId",auth,belongsToWorkspace,getWorkspaceTasks);
router.get("/workspace/:workspaceId/:taskId",auth,belongsToWorkspace,getTask);
router.put("/:taskId",auth,canModifyTask,updateTask);
router.delete("/:taskId",auth,canModifyTask,deleteTask);
router.patch("/:taskId",auth,belongsToTask,changeTaskStatus);

export default router;