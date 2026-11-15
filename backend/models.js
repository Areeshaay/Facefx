// Data layer: the 5 MongoDB collections from the ERD (Chapter 3.4)
import mongoose from 'mongoose';
const { Schema, model } = mongoose, ref = n => ({ type: Schema.Types.ObjectId, ref: n });
export const User = model('User', new Schema({ name: String, email: { type: String, unique: true }, passwordHash: String, role: { type: String, default: 'user' } }, { timestamps: true }));
export const Filter = model('Filter', new Schema({ name: String, category: String, type: { type: String, enum: ['overlay', 'color', 'ai'] }, config: Object, thumbnail: String, isActive: { type: Boolean, default: true }, createdBy: ref('User') }, { timestamps: true }));
export const Photo = model('Photo', new Schema({ userId: ref('User'), filterId: ref('Filter'), imageData: String }, { timestamps: true }));
export const Favorite = model('Favorite', new Schema({ userId: ref('User'), filterId: ref('Filter') }, { timestamps: true }));
export const UsageLog = model('UsageLog', new Schema({ userId: ref('User'), filterId: ref('Filter'), action: String }, { timestamps: true }));
