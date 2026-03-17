/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model } from 'mongoose';
export enum UserRole {
  USER = 'USER',
  admin = 'admin',
  DRIVER = 'DRIVER',
}
export enum status {
  pending = 'pending',
  active = 'active',
  blocked = 'blocked',
}
type Status = 'active' | 'inactive';
// export enum Gender {
//   Male = 'Male',
//   Female = 'Female',
// }
 interface Verification {
  otp: string | number;
  expiresAt: Date;
  status: boolean;
}
interface image {
  id: string | number;
  url: string;
}
export interface ILocation {
  type: "Point";
  coordinates: [longitude: number, latitude: number]; // [lng, lat]
}

export interface TUser {
  [x: string]: any;
  id?: string;
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  website: string;
  categore: string;
  image: image;
  needsPasswordChange: boolean;
  passwordChangedAt?: Date;
  role: UserRole;
  status?: Status;
  isVerified: boolean;
  isActive: boolean;
  isDeleted: boolean;
  verification: Verification;
  stripe_customer_id?: string | null;
  accountType?: 'emailvarifi' | 'google' | 'facebook' | 'linkedin' | 'apple';
  // countryCode: string;
  location: ILocation;
  fcmToken?: string;
  soketId?: string;
}

export interface UserModel extends Model<TUser> {
  isUserExist(email: string): Promise<TUser>;
                      //countryCode: string,
  isUserExistByNumber( phoneNumber: string): Promise<TUser>;
  IsUserExistbyId(id: string): Promise<TUser>;
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
}
