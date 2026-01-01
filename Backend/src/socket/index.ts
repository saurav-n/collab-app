import {Server} from 'socket.io'
import {Server as HttpServer} from 'http'
import { AuthenticatedSocket, socketAuth } from './middleware'
import { registerChatRoomHandler } from './handlers/workspace-chatroom'
import { registerRoomMessageHandler } from './handlers/room-message'

export const initSocket=(httpServer:HttpServer)=>{
    const io=new Server(httpServer,{
        cors:{
            origin:process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials:true,
            methods:["GET","POST"]
        }
    })

    io.use(socketAuth)

    io.on("connection",(socket:AuthenticatedSocket,ack?:(response:{ok:boolean,error?:string})=>void)=>{
        console.log('socket user',socket.user)
        registerChatRoomHandler(io,socket)
        registerRoomMessageHandler(io,socket)
        ack?.({ok:true})
    })
}