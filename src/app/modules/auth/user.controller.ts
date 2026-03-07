import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import catchAsync from '../../utils/catchAsync';
import { Request, Response } from 'express';
import User from '../user/user.model';
import httpStatus  from 'http-status';
import AppError from '../../error/AppError';
import jwt, { JwtPayload, Secret  } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from '../../config';
import sendResponse from '../../utils/sendResponse';
import  {  authServices,  userResetPasswordService, } from './user.service';
import { UserRole } from '../user/user.interface';
// import { AuthServices } from './user.service';
import * as appleSignin from 'apple-signin-auth';
import { ApplePayload } from './user.interface';



// const googleClient = new OAuth2Client('23601987612-4e3n9lf08s8hnh0o9m8ag8n22f82u2ki.apps.googleusercontent.com'); // Replace with your Google Client ID
const googleClient = new OAuth2Client('23601987612-ko94q8ki1ui42igekam6f87kamceuvu4.apps.googleusercontent.com');



const userRegistration = catchAsync(async (req: Request, res: Response) => {
  // register service থেকে OTP generate হবে, user DB-এ এখনো save হবে না
  const { email } = req.body;
  const result = await authServices.register(req.body);
  console.log('Registration result:', result);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: `OTP sent to ${email}. Please verify to complete registration`,
    data: { email , otp: result.otp as number}, // শুধু email পাঠাচ্ছি. OTP response এ দিচ্ছি শুধু testing এর জন্য, production এ দিও না
  });
});







const verifyEmailController = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  // verifyOtp service → OTP check + DB save
  const user = await authServices.verifyEmail(email, Number(otp));
 const accessToken = jwt.sign({ id: user._id, role: user.role }, config.jwt.jwt_access_secret as string, { expiresIn: '24h' });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'OTP verified successfully. User registration complete.',
    data: {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      countryCode: user.countryCode,
      role: user.role,
      isVerified: user.isVerified,
      accessToken,
    },
  });
});






export const googleLogin = async (req: Request, res: Response) => {
  const { idToken, role } = req.body;

   if (!idToken) throw new AppError(httpStatus.BAD_REQUEST, 'idToken required');
   if (!role) throw new AppError(httpStatus.BAD_REQUEST, 'Role required');

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: '23601987612-ko94q8ki1ui42igekam6f87kamceuvu4.apps.googleusercontent.com',
    });

    const payload = ticket.getPayload();
    console.log('Google payload:', payload);
    if (!payload?.email)  throw new AppError(httpStatus.BAD_REQUEST, 'Invalid Google token');

    let user = await User.findOne({ email: payload.email });
if (!user) {
  user = await User.create({
    email: payload.email,
    role: role,   // Google login এর সময় role কে dynamic করার জন্য
    fullName: payload.name,
    isVerified: true,
    accountType: 'google',
    image: {
      id: 'google', // যেকোনো default id
      url: payload.picture || 'https://i.ibb.co/z5YHLV9/profile.png',
    },
  });
}

    const accessToken = jwt.sign({ id: user._id, role: user.role }, config.jwt.jwt_access_secret as string, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ id: user._id, role: user.role }, config.jwt.jwt_refresh_secret as string, { expiresIn: '7d' });
  


 sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Login successful',
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
    // res.json({ success: true, user, accessToken, refreshToken });
  } catch (err) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Google login failed', err instanceof Error ? err.message : undefined);
  }
};










const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !user?.password) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Incorrect password');
  }

  const accessToken = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    config.jwt.jwt_access_secret as Secret,
    { expiresIn: '24h' },
  );

  const refreshToken = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    config.jwt.jwt_refresh_secret as Secret,
    { expiresIn: '7d' },
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Login successful',
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});



// const resetPassword = catchAsync(async (req: Request, res: Response) => {
//   const token = req.headers.token as string;
//   const { email, newPassword, confirmPassword } = req.body;

//   if (!token) throw new AppError(httpStatus.UNAUTHORIZED, 'Token missing');
//   if (!email || !newPassword || !confirmPassword) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Email, newPassword and confirmPassword are required');
//   }
//   if (newPassword !== confirmPassword) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Passwords do not match');
//   }

//   let decoded: JwtPayload;
//   try {
//     decoded = jwt.verify(token, config.jwt.jwt_access_secret as Secret) as JwtPayload;
//   } catch {
//     throw new AppError(httpStatus.FORBIDDEN, 'Token expired or invalid');
//   }

//   if (!decoded?.id || !decoded?.allowReset) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'OTP not verified or reset not allowed');
//   }

//   const user = await User.findById(decoded.id).select('+password');
//   if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found');

//   // Hash the new password
//  user.password = await bcrypt.hash(newPassword.trim(), 10);
//   await user.save();

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Password reset successfully',
//     data: { user },
//   });
// });



 const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, newPassword, confirmPassword } = req.body;

  // ✅ Validation
  if (!email || !newPassword || !confirmPassword) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Email, newPassword and confirmPassword are required'
    );
  }

  if (newPassword !== confirmPassword) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Passwords do not match'
    );
  }

  // ✅ Find user by email
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // ✅ Hash the new password
  user.password = await bcrypt.hash(newPassword.trim(), 10);
  await user.save();

  // ✅ Send success response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password reset successfully',
    data: null,
  });
});

const changePassword = catchAsync(
  async (req: Request, res: Response) => {
 

    const userId = req.user?.id;
    const { oldPassword, newPassword } = req.body;

    // ❌ Validation
    if (!oldPassword || !newPassword) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Old password and new password are required'
      );
    }

    // 🔍 Find user with password
    const user = await User.findById(userId).select('+password');

    if (!user || !user.password) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    // 🔐 Check old password
    const isMatched = await bcrypt.compare(oldPassword, user.password);

    if (!isMatched) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Old password is incorrect'
      );
    }

    // 🔄 Update password
    user.password = newPassword; // raw password
    await user.save(); // 🔥 pre-save hash হবে

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Password changed successfully',
      data: null,
    });
  }
);



const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Refresh token is required');
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      config.jwt.jwt_refresh_secret as Secret,
    ) as JwtPayload;
    const token = jwt.sign(
      { id: decoded.id, role: decoded.role },
      config.jwt.jwt_access_secret as Secret,
      { expiresIn: '24h' },
    );




    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Access token refreshed',
      data: { token },
    });
  } catch {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Invalid or expired refresh token',
    );
  }
});












export const appleLogin = catchAsync(async (req: Request, res: Response) => {
  const { identityToken, role } = req.body;

  if (!identityToken) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Apple identity token is required');
  }

  if (!role) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Role is required');
  }

  // 🔹 Verify the Apple JWT
  let applePayload: ApplePayload;
  try {
    applePayload = await appleSignin.verifyIdToken(identityToken, {
      audience: config.apple.client_id, // Bundle ID (iOS) or Service ID (Web)
      ignoreExpiration: false,
    }) as ApplePayload;
  } catch (err) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid Apple identity token');
  }

  console.log('Apple payload:', applePayload);

  const { sub: appleId, email, name } = applePayload;

  // 🔹 Fallback email if Apple doesn't provide it
  const finalEmail = email || `${appleId}@apple.com`;

  // 🔹 Find existing user
  let user = await User.findOne({ email: finalEmail });

  // 🔹 Create user if not found
  if (!user) {
    const fullName = name?.firstName
      ? `${name.firstName} ${name.lastName || ''}`
      : 'Apple User';

    user = await User.create({
      email: finalEmail,
      role: role, // Apple login এর সময় role কে dynamic করার জন্য
      fullName,
      accountType: 'apple',
      isVerified: true,
        image: {
        id: 'apple', // any default id
        url: 'https://i.ibb.co/z5YHLV9/profile.png',
      },
      // role: UserRole.customer,
    });
  }

  // 🔹 Generate JWT tokens
  const accessTokenJwt = jwt.sign(
    { id: user._id, role: user.role },
    config.jwt.jwt_access_secret as Secret,
    { expiresIn: '24h' }
  );

  const refreshToken = jwt.sign(
    { id: user._id, role: user.role },
    config.jwt.jwt_refresh_secret as Secret,
    { expiresIn: '7d' }
  );

  // 🔹 Send response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Apple login successful',
    data: {
      user,
      accessToken: accessTokenJwt,
      refreshToken,
    },
  });
});





// neja korce ai api gulla oky

const codeVerification = catchAsync(async (req: Request, res: Response) => {
 const { email } = req.body;

    if (!email) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Email is required');
    }

  const otp = await authServices.sendVerificationCode(email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP sent successfully, please verify before reset password',
    data: { email, otp }, // 🔒 prod এ otp response দিও না, শুধুমাত্র email
  });
});







export const verifyOtpController = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
   if (!email || !otp) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Email and OTP are required');
    }

  await authServices.userVerifyOtp(email, Number(otp));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP verified successfully. You can now reset your password.',
    data: { email },
  });
});


export const userResetPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Email, newPassword and confirmPassword are required',
      );
    }

    if (newPassword !== confirmPassword) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Passwords do not match');
    }

    await userResetPasswordService(email, newPassword);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Password reset successful',
      data: {},
    });
  },



);













export const setPasswordController = catchAsync(
  async (req: Request, res: Response) => {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Email, newPassword and confirmPassword are required',
      );
    }

    if (newPassword !== confirmPassword) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Passwords do not match');
    }
   

    const result = await authServices.SetPasswordService(email, newPassword);
   

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Password reset successful',
       data: result,
    });
  },
);









// forgot password এর জন্য OTP verify করার পরে password set করার জন্য এই controller টা ব্যবহার করব।



 const sendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError(400, 'Email is required');

  await authServices.Enteryouremail(email);

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully to your email',
  });
});





 const verifyOtpOnly = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new AppError(400, 'Email and OTP are required');

  // Verify OTP
  await authServices.verifyOtp(email, Number(otp));

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
  });
});




/* =========================
   Change My Status (JWT based)
========================= */
export const changeMyStatus = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.body;

  if (!req.user || !req.user.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  if (!status || !['active', 'inactive'].includes(status)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Status must be "active" or "inactive"');
  }

  // ✅ Type assertion to fix TS error
  const updatedUser = await authServices.changeMyStatusService(req.user.id, status as 'active' | 'inactive');

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Your status updated to ${status}`,
    data: updatedUser,
  });
});



 const MyLocation = catchAsync(async (req: Request, res: Response) => {
  const { latitude, longitude } = req.body; // ✅ declare here

  if (!req.user || !req.user.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  if (latitude === undefined || longitude === undefined) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Latitude and Longitude are required');
  }

  const updatedUser = await authServices.updateMyLocationService(req.user.id, [longitude, latitude]);

  // password remove + response format
  const { password, location, ...userWithoutPassword } = updatedUser;

  const responseUser = {
    ...userWithoutPassword,
    latitude: location.coordinates[1],
    longitude: location.coordinates[0],
  };

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User location updated successfully',
    data: responseUser,
  });
});






export const authControllers = {
  login,
  sendOtp,
  verifyOtpOnly,
  resetPassword,
  verifyOtpController,
  codeVerification,
  changePassword,
  MyLocation,
  refreshToken,
  googleLogin,
  changeMyStatus,
  setPasswordController,
  userRegistration,
  appleLogin,
  verifyEmailController,
};
