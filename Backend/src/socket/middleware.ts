import { Socket } from "socket.io"
import jwt from "jsonwebtoken"


interface JWTUserPayload {
    id: string
    email: string
    isVerified: boolean
}
export interface AuthenticatedSocket extends Socket {
  user?: JWTUserPayload
}

export const socketAuth=async(socket:AuthenticatedSocket,next:(err?:Error)=>void)=>{
    try {
        const token=socket.handshake.auth.token || socket.handshake.query.token
        if(!token){
            throw new Error("Unauthorized")
        }
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET!)
        socket.user=decodedToken as JWTUserPayload
        next()
    } catch (error) {
        next(new Error("Unauthorized"))
    }
}