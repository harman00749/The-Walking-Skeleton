import bcrypt from "bcryptjs";
import { Schema, model, type HydratedDocument } from "mongoose";

export interface UserRecord {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<UserRecord>;

const userSchema = new Schema<UserRecord>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    password: { type: String, required: true, minlength: 8, select: false },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.toJSON = function sanitizeUser() {
  const user = this.toObject();
  delete user.password;
  return user;
};

export const User = model<UserRecord>("User", userSchema);
