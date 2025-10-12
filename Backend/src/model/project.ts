import mongoose from "mongoose"
import Workspace from "./workspace"

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
},{timestamps: true});

// projectSchema.pre("save", async function (next) {
//   if (!this.isModified("workspace")) {
//     return next();
//   }

//   const workspace = await Workspace.findById(this.workspace);

//   if (!workspace) {
//     return next(new Error("Workspace not found"));
//   }

//   this.owner = workspace.owner;

//   next();
// });

export default mongoose.model("Project", projectSchema);