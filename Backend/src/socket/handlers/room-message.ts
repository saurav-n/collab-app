import { Server } from "socket.io";
import { AuthenticatedSocket } from "../middleware";
import Message from "../../model/message";
import user from "../../model/user";

export const registerRoomMessageHandler = (
  io: Server,
  socket: AuthenticatedSocket
) => {
  socket.on(
    "room-message:send",
    async (
       arg:any,
      ack?: (response: { ok: boolean; error?: string,data?:any }) => void
    ) => {
      try {
        const {roomId,message}=JSON.parse(arg) as {roomId:string,message:string};
        const roomSockets = await io.in(`chat-room:${roomId}`).fetchSockets();
        const isSocketInRoom = roomSockets.some((s) => {
            console.log('s',(s as unknown as AuthenticatedSocket).user)
          return (
            (s as unknown as AuthenticatedSocket).user?.id.toString() ===
            socket.user?.id.toString()
          );
        });
        if (!isSocketInRoom) {
          ack?.({ ok: false, error: "You are not in this room" });
          return;
        }

        const msgDoc=await Message.create({
          senderId: socket.user?.id,
          content: message,
          project: roomId,
        });

        const sender=await user.findById(socket.user?.id)

        socket.to(`chat-room:${roomId}`).emit("room-message:receive", {
          roomId:`chat-room:${roomId}`,
          messageId:msgDoc.id,
          message:message,
          senderId: socket.user?.id,
          senderName:sender?.userName,
          timestamp:msgDoc.createdAt
        });
        ack?.({ ok: true,data:msgDoc });
      } catch (error) {
        const errMsg = (error as Error).message;
        ack?.({ ok: false, error: errMsg });
      }
    }
  );
};
