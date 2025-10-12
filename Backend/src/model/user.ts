import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import ms from "ms";


const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified:{
    type:Boolean,
    default:false
  },
  verificationCode:{
    code:String,
    expires:Date
  },
  avatar:{
    public_id:String,
    url:String
  },
  refreshToken:{
    type:String,
    default:""
  },
  passwordResetToken:{
    type:String,
    default:""
  }
},{timestamps: true});

userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};


userSchema.methods.generateVerificationCode = async function () {
  const code = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  this.verificationCode = { code, expires: new Date(Date.now() + 5*60*1000) };
  await this.save();
  return code;
};

userSchema.methods.isCodeValid = function (code: string) {
  if(this.verificationCode.code!=code){
    return 0; // code not valid
  }
  if (this.verificationCode.expires < new Date()) {
    return 2; // code expired
  }

  return 1

}

userSchema.methods.generateAuthTokens= async function(){
  const accessToken = jwt.sign({
    id:this._id,
    email:this.email,
    isVerified:this.isVerified
  },process.env.ACCESS_TOKEN_SECRET!,{expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as ms.StringValue});

  const refreshToken = jwt.sign({
    id:this._id,
    email:this.email,
    isVerified:this.isVerified
  },process.env.REFRESH_TOKEN_SECRET!,{expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as ms.StringValue});

  this.refreshToken = refreshToken;
  await this.save();
  return {accessToken,refreshToken};
}

userSchema.methods.getAccessToken=async function () {
  const accessToken = jwt.sign({
    id:this._id,
    email:this.email,
    isVerified:this.isVerified
  },process.env.ACCESS_TOKEN_SECRET!,{expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as ms.StringValue});

  return accessToken
}

userSchema.methods.generatePasswordResetToken = async function () {
  const resetToken=jwt.sign({
    userName:this.userName,
    email:this.email,
    password:this.password
  },process.env.PASSWORD_RESET_TOKEN_SECRET!,{expiresIn: process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN as ms.StringValue});

  this.passwordResetToken = resetToken;
  await this.save();
  return resetToken;
};

export default mongoose.model("User", userSchema);
