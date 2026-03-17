/* eslint-disable @typescript-eslint/no-this-alias */
import bcrypt from 'bcrypt';
import { model, Schema } from 'mongoose';
import config from '../../config';

import { Types } from 'mongoose';
import { TUser, UserModel, UserRole } from './user.interface';


// Define the schema for Verification
const VerificationSchema = new Schema({
  otp: {
    type: Number, // Allows string or number
    required: true,
  },
  expiresAt: {
    type: Date,
    // required: true,
  },

  status: {
    type: Boolean,
    required: true,
  },
});
const imageSchema = new Schema({
  id: {
    type: String, // Allows string or number
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
});
// Define the schema for the User model
const UserSchema = new Schema<TUser, UserModel>(
  {
    email: {
      type: String,
      unique: true,
      required: function(this: TUser) {
    return this.isVerified === true;
  },
    },
    image: imageSchema,
    fullName: {
      type: String,
      // required: function(this: TUser) {
    // return this.isVerified === true;
  // },45
    },
    password: {
      type: String,
      required: function(this: TUser) {
      return this.isVerified === true;
       },
      select: false,
    },
   

    phoneNumber: {
      type: String,
      // required: true,
      // required: function(this: TUser) { return this.isVerified === true; },
      sparse: true, // ⚡ social login এর জন্য
      unique: true,
    
    },
    needsPasswordChange: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: {
      type: Date,

    },
    accountType: {
      type: String,
      enum: ['emailvarifi', 'google', 'facebook', 'linkedin', 'apple'],
      default: 'emailvarifi',
    },
     status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
     
    },
      stripe_customer_id: {type: String, default: null},
  
    subscription: {
      plan: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription',
      },
      startsAt: Date,
      expiresAt: Date,
      status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active',
      },
    },
   
 location: {
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number], // ✅ শুধু Number array
    // required: true
  }
},
    // ✅ SOCKET FIELD
    socketId: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    verification: {
      type: VerificationSchema,
      required: false,
    },
  },
  {
    timestamps: true, 
  },
);



//👉 Password change না হলে hash করবে না

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(
    this.password as string,
    Number(config.bcrypt_salt_rounds),
  );
  next();
});


// GEO index for nearby driver search
UserSchema.index({ location: "2dsphere" });




// set '' after saving password
UserSchema.post('save', function (doc, next) {
  doc.password = '';
  next();
});

// Check if a user exists by email
UserSchema.statics.isUserExist = async function (
  email: string,
): Promise<TUser | null> {
  return this.findOne({ email }).select('+password');
};

// Check if a user exists by phone number
UserSchema.statics.isUserExistByNumber = async function (
  countryCode: string,
  phoneNumber: string,
) {
  return this.findOne({ countryCode, phoneNumber }).select('+password');
};


UserSchema.statics.IsUserExistbyId = async function (
  id: string,
): Promise<Pick<TUser, '_id' | 'email' | 'role' | 'password'> | null> {
  return this.findOne({
    _id: new Types.ObjectId(id),
    isDeleted: { $ne: true },
  }).select('+password');
};

// Compare plain text password with hashed password
UserSchema.statics.isPasswordMatched = async function (
  plainTextPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, hashedPassword);
};

// filter out deleted documents
UserSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

UserSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

UserSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});
// Create and export the User model
const User = model<TUser, UserModel>('User', UserSchema);

export default User;
