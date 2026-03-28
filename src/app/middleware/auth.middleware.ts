


import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import httpStatus from 'http-status';
import config from '../config';
import AppError from '../error/AppError';
import catchAsync from '../utils/catchAsync';
import { Admin } from '../modules/Dashboard/admin/admin.model';
import User from '../modules/user/user.model';
import { USER_ROLE, UserRole } from '../modules/user/user.constant';

const auth = (...allowedRoles: UserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    /* =====================
       1️⃣ Authorization Header
    ====================== */
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized');
    }

    const token = authHeader.split(' ')[1];

    /* =====================
       2️⃣ Verify JWT
    ====================== */
    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(
        token,
        config.jwt.jwt_access_secret as string,
      ) as JwtPayload;
    } catch {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token');
    }

    const userId = decoded.id || decoded.userId;
    const role = decoded.role as UserRole;

    /* =====================
       3️⃣ Find user by role
       ✅ ONLY admin → Admin model
       ✅ Others → User model
    ====================== */
    let user: any = null;

    if (role === USER_ROLE.admin) {
      user = await Admin.findById(userId);
    } else {
      user = await User.IsUserExistbyId(userId);
    }

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, `${role} not found`);
    }

    /* =====================
       4️⃣ Role permission check
    ====================== */
    if (allowedRoles.length && !allowedRoles.includes(role)) {
      throw new AppError(httpStatus.FORBIDDEN, 'Access denied');
    }

    /* =====================
       5️⃣ Attach user to request
    ====================== */
    req.user = {
      id: user._id,
      userId: user._id,
      _id: user._id,
      email: user.email,
      role: user.role,
    };

    next();
  });
};

export default auth;
