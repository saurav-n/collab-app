import {Resend} from "resend";
import AppError from "./appError";
import mailTransportter from "../lib/mailTransportter";

console.log("Resend API Key:", process.env.RESEND_API_KEY);
const resend = new Resend(process.env.RESEND_API_KEY!);

export const sendVerificationEmail = async (to: string, code: number) => {
  try {
    // const response=await resend.emails.send({
    //   from: "noreply@resend.dev",
    //   to,
    //   subject: "Verify your email",
    //   html: `<h1>Verify your email</h1><strong>Your verification code is ${code}</strong>`,
    // });
    const response=await mailTransportter.sendMail({
      from: "noreply@ethereal.email",
      to,
      subject: "Verify your email",
      html: `<h1>Verify your email</h1><strong>Your verification code is ${code}</strong>`,
    });
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new AppError("Email Error","Failed to send verification email",500);
  }
};

export const sendPasswordResetEmail = async (to: string, token:string) => {
  try {
    // const response=await resend.emails.send({
    //   from: "noreply@resend.dev",
    //   to,
    //   subject: "Reset your password",
    //   html: `<h1>Reset your password</h1><strong><a href="${process.env.BASE_URL}/reset-password/${token}">Click here to reset your password</a></strong>`,
    // });
    const response=await mailTransportter.sendMail({
      from: "noreply@ethereal.email",
      to,
      subject: "Reset your password",
      html: `<h1>Reset your password</h1><strong><a href="${process.env.FRONTEND_URL}/reset-password/${token}">Click here to reset your password</a></strong>`,
    });
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new AppError("Email Error","Failed to send password reset email",500);
  }
};