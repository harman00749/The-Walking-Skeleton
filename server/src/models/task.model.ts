import { Schema, Types, model, type HydratedDocument } from "mongoose";

export const taskStatuses = ["todo", "in-progress", "done"] as const;
export const taskPriorities = ["low", "medium", "high"] as const;

export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = (typeof taskPriorities)[number];

export interface TaskRecord {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  authorId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskDocument = HydratedDocument<TaskRecord>;

const taskSchema = new Schema<TaskRecord>(
  {
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    status: { type: String, enum: taskStatuses, default: "todo", index: true },
    priority: { type: String, enum: taskPriorities, default: "medium", index: true },
    dueDate: { type: Date, default: null },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true, index: true },
  },
  { timestamps: true },
);

taskSchema.index({ authorId: 1, createdAt: -1 });

export const Task = model<TaskRecord>("Task", taskSchema);
