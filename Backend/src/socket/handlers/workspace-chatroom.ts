import { Server } from "socket.io";
import { AuthenticatedSocket } from "../middleware";
import { ProjectDocument } from "../../model/project";
import Project from "../../model/project";

export const registerChatRoomHandler = (
  io: Server, 
  socket: AuthenticatedSocket
) => {
  socket.on(
    "chat-room:join",
    async (
      projectId: string,
      ack?: (response: { ok: boolean; error?: string }) => void
    ) => {
      try {
        if (!projectId) {
          ack?.({ ok: false, error: "project id is required" });
          return;
        }
        const project = (await Project.findById(
          projectId
        )) as ProjectDocument;
        if (!project) {
          ack?.({ ok: false, error: "project not found" });
          return;
        }
        const isProjectMember =
          project.owner.toString() === socket.user?.id.toString() ||
          project.members.some(
            (m) =>
              m.toString() === socket.user?.id.toString() 
          );
        if (!isProjectMember) {
          ack?.({ ok: false, error: "You are not a member of this project" });
          return;
        }
        socket.join(`chat-room:${projectId}`);
        console.log('you joinded',socket.user?.email)
        ack?.({ ok: true });
      } catch (error) {
        const errMsg = (error as Error).message;
        ack?.({ ok: false, error: errMsg });
      }
    }
  );

  socket.on(
    "chat-room:leave",
    async (
      projectId: string,
      ack?: (response: { ok: boolean; error?: string }) => void
    ) => {
      try {
        if (!projectId) {
          ack?.({ ok: false, error: "project id is required" });
          return;
        }
        const project = (await Project.findById(
          projectId
        )) as ProjectDocument;
        if (!project) {
          ack?.({ ok: false, error: "project not found" });
          return;
        }
        console.log(await io.in(`chat-room:${projectId}`).fetchSockets());
        socket.leave(`chat-room:${projectId}`);
        ack?.({ ok: true });
      } catch (error) {
        const errMsg = (error as Error).message;
        ack?.({ ok: false, error: errMsg });
      }
    }
  );
};
