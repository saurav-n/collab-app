import { Router } from "express";
import { deleteMessage, editMessage, getProjectMessages } from "../controller/message";
import { auth } from "../middleware/auth";
import { isMsgOwner } from "../middleware/message";
import { isProjectMember } from "../middleware/project";

const messageRouter = Router();

messageRouter.use(auth)

messageRouter.get("/:projectId/messages",isProjectMember,getProjectMessages);
messageRouter.delete("/:messageId",isMsgOwner,deleteMessage);
messageRouter.patch("/:messageId",isMsgOwner,editMessage);

export default messageRouter;