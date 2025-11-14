import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const taskSchema = new mongoose.Schema({
  name:{
    type: String,
    required: true
  },
  description:{
    type: String,
    required: true
  },
  dueDate:{
    type: Date,
    required: true
  },
  status:{
    type: String,
    enum:['backlog','todo','in-progress','in-review','done'],
    default: 'backlog',
  },
  assignee:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  workspace:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  owner:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
},{
  timestamps: true
});

taskSchema.plugin(mongooseAggregatePaginate);

export default mongoose.model('Task', taskSchema);