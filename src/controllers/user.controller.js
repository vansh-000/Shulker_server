import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import { cookiesOptions } from "../utils/cookiesOptions.js";
import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";
import jwt from "jsonwebtoken";
import { Meeting } from "../models/meetings.model.js";

const generateAccessAndRefreshToken = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    throw new ApiError("All fields are required", 400);
  }
  if (await User.findOne({ email })) {
    throw new ApiError("Email already exists", 409);
  }
  if (await User.findOne({ username })) {
    throw new ApiError("Username already exists", 409);
  }
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
    firstname: "user_",
    lastname: username.toLowerCase(),
    avatar: process.env.BACKEND_URL + "/user.png",
  });
  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError("User creation failed", 500);
  }
  res.json(new ApiResponse("User registered Successfully", 200, createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError("Username or Email is required", 400);
  }
  const user = await User.findOne({
    $or: [
      { username: username?.toLowerCase() },
      { email: email?.toLowerCase() },
    ],
  });
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  if (!(await user.isPasswordCorrect(password))) {
    throw new ApiError("Invalid credentials", 401);
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  res
    .cookie("accessToken", accessToken, cookiesOptions)
    .cookie("refreshToken", refreshToken, cookiesOptions)
    .json(
      new ApiResponse("User logged in Successfully", 200, {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );
  res
    .clearCookie("accessToken", cookiesOptions)
    .clearCookie("refreshToken", cookiesOptions)
    .json(new ApiResponse("User logged out Successfully", 200));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError("Refresh Token expired", 401);
  }
  const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(decoded._id);
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError("Invalid Refresh Token", 401);
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
  res
    .cookie("accessToken", accessToken, cookiesOptions)
    .cookie("refreshToken", refreshToken, cookiesOptions)
    .json(new ApiResponse("Token refreshed", 200, { accessToken, refreshToken }));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res.json(new ApiResponse("Password changed successfully", 200));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId)
    .select("-password -refreshToken")
    .populate({
      path: "personalRoomId",
      model: "Meeting",
      populate: [
        { path: "createdBy", model: "User", select: "username email avatar" },
        { path: "participants", model: "User", select: "username email avatar" }
      ]
    });

  if (!user) {
    throw new ApiError("User not found", 404);
  }
  res.json(new ApiResponse("Current user fetched", 200, user));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError("Email is required", 400);
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const message = `Click the link below to reset your password: \n\n${resetUrl}\n\nThis link is valid for 10 minutes.`;
  await sendEmail({
    email: email,
    subject: "Password Reset",
    message,
  });
  res.json(new ApiResponse("Password reset email sent", 200));
});

const googleAuthCallback = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
  const accessToken = req.user.generateAccessToken();
  const refreshToken = req.user.generateRefreshToken();
  req.user.refreshToken = refreshToken;
  await req.user.save({ validateBeforeSave: false });
  const redirectUrl = `${process.env.FRONTEND_URL}/auth-success?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`;

  res.redirect(redirectUrl);
});

const updateAvatar = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  if (!req.file) {
    throw new ApiError("No file uploaded", 400);
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  if (user.avatarId && !user.avatar.includes("default.webp")) {
    try {
      await cloudinary.uploader.destroy(user.avatarId);
    } catch (err) {
      console.error("Error deleting old avatar:", err.message);
    }
  }
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "avatars",
      format: "webp",
      transformation: [{ width: 300, height: 300, crop: "fill" }],
    },
    async (error, result) => {
      if (error) {
        next(new ApiError("Failed to upload avatar", 500));
      } else {
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { avatar: result.secure_url, avatarId: result.public_id },
          { new: true, select: "-password -refreshToken" }
        );
        res.json(new ApiResponse("Avatar updated successfully", 200, updatedUser));
      }
    }
  );
  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
});

const editUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { firstname, lastname, bio, dob } = req.body;
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { firstname, lastname, bio, dob },
    { new: true, select: "-password -refreshToken" }
  );
  if (!updatedUser) {
    throw new ApiError("User not found", 404);
  }
  res.json(new ApiResponse("User profile updated successfully", 200, updatedUser));
});

const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError("Both current and new passwords are required", 400);
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  if (!(await user.isPasswordCorrect(currentPassword))) {
    throw new ApiError("Current password is incorrect", 401);
  }
  user.password = newPassword;
  await user.save();
  res.json(new ApiResponse("Password changed successfully", 200));
});

const sendEmailVerification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (user.isEmailVerified) {
    throw new ApiError("Email is already verified", 400);
  }

  const verificationToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

  const subject = "Verify Your Email Address - SHULKER";

  const message = `
Hello ${user.firstname || "there"},

Welcome to SHULKER! 🎉  

To complete your registration and verify your email address, please click the link below:

🔗 ${verifyUrl}

This link will expire in **10 minutes**, so be sure to verify soon.

If you did not request this email, you can safely ignore it.

Best regards,  
The SHULKER Team
`;

  await sendEmail({
    email: user.email,
    subject,
    message,
  });

  res.json(new ApiResponse("Verification email sent", 200));
});


const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  });
  if (!user) {
    throw new ApiError("Invalid or expired token", 400);
  }
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();
  res.json(new ApiResponse("Email verified successfully", 200));
});

const personalMeetingRoom = asyncHandler(async (req, res) => {
  const userId = String(req.user._id);
  const { meetingId } = req.body;

  if (!meetingId) throw new ApiError("meetingId is required", 400);

  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) throw new ApiError("Meeting not found", 404);

  if (meeting.createdBy.toString() !== userId) {
    throw new ApiError("You cannot set another user's meeting as your personal room", 403);
  }

  meeting.status = 'personal';
  await meeting.save();

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { personalRoomId: meeting._id },
    { new: true }
  ).lean();

  delete updatedUser.password;
  delete updatedUser.refreshToken;
  delete updatedUser.resetPasswordToken;
  delete updatedUser.emailVerificationToken;

  res.json(
    new ApiResponse(
      "Personal meeting room set successfully",
      200,
      updatedUser
    )
  );
});

export {
  registerUser,
  personalMeetingRoom,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  getCurrentUser,
  resetPassword,
  googleAuthCallback,
  updateAvatar,
  editUserProfile,
  changePassword,
  sendEmailVerification,
  verifyEmail,
};
