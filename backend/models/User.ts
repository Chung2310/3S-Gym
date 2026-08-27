import mongoose from 'mongoose';
export type UserRole = 'ADMIN' | 'PT' | 'CUSTOMER';
export type UserStatus = 'ACTIVE' | 'LOCKED';

export interface IUser {
    username: string; fullName: string; email?: string; avatarUrl: string;
    dateOfBirth: Date | null; gender: 'MALE' | 'FEMALE' | 'OTHER'; phone?: string;
    address: string; specialization: string; yearsOfExperience: number;
    certificates: string[]; bio: string; password: string; role: UserRole; status: UserStatus;
}
const userSchema = new mongoose.Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        trim: true,
        default: ''
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: undefined,
        unique: true,
        sparse: true
    },
    avatarUrl: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], default: 'OTHER' },
    phone: { type: String, trim: true, default: undefined, unique: true, sparse: true },
    address: { type: String, trim: true, default: '' },
    specialization: { type: String, trim: true, default: '' },
    yearsOfExperience: { type: Number, min: 0, max: 80, default: 0 },
    certificates: [{ type: String, trim: true }],
    bio: { type: String, trim: true, maxlength: 1000, default: '' },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['ADMIN', 'PT', 'CUSTOMER'],
        default: 'PT'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'LOCKED'],
        default: 'ACTIVE'
    }
}, { timestamps: true });

const User = mongoose.model<IUser>('User', userSchema);
export type UserDocument = mongoose.HydratedDocument<IUser>;
export default User;
