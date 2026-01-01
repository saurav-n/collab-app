import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const messageSchema = new mongoose.Schema({
  senderId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },
  content:{
    type:String
  },
  project:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Project",
    required:true
  },
},{timestamps:true});

messageSchema.plugin(mongooseAggregatePaginate);

const Message = mongoose.model("Message",messageSchema);

export default Message;