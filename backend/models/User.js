const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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

module.exports = mongoose.model('User', userSchema);
