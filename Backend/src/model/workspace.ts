import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import ms from "ms";

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  members: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      role: String,
    },
  ],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  avatar:{
    public_id:String,
    url:String
  },
  inviteTokens:[
    {
      token:String,
      expires:Date
    }
  ]
},{timestamps: true});

workspaceSchema.methods.generateInviteToken = async function () {
  const token = jwt.sign({ workspaceId: this._id, inviteTime: new Date() }, process.env.INVITE_TOKEN_SECRET!, { expiresIn: process.env.INVITE_TOKEN_EXPIRES_IN as ms.StringValue });
  this.inviteTokens.push({ token, expires: new Date(Date.now() +24*60* 60 * 1000) });
  await this.save();
  return token;
};

workspaceSchema.methods.isTokenValid = function (token: string) {
  if (this.inviteTokens.length === 0) {
    return 2; // no tokens
  }

  const tokenIndex = this.inviteTokens.findIndex((t:{token:string}) => t.token === token);
  if (tokenIndex === -1) {
    return 0; // token not found
  }

  if (this.inviteTokens[tokenIndex].expires < new Date()) {
    return -1; // token expired
  }

  return 1; // token valid
};

export default mongoose.model("Workspace", workspaceSchema);

export type WorkspaceDocument = mongoose.Document & {
  name: string;
  description: string;
  members: Array<{
    userId: mongoose.Types.ObjectId;
    role: string;
  }>;
  owner: mongoose.Types.ObjectId;
  avatar:{
    public_id:String,
    url:String
  },
  inviteTokens:Array<{
    token:string,
    expires:Date
  }>
};