import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import User, { type UserDocument } from '../models/User.js';
import FeatureFlag from '../models/FeatureFlag.js';
import Exercise from '../models/Exercise.js';

let mongo: MongoMemoryServer; let adminToken: string; let ptToken: string; let otherPtToken: string;
const tokenFor = (user: UserDocument): string => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key');
beforeAll(async () => {
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('MatKhau123!', 10);
  const admin = await User.create({ username: 'admin-exercise', password, role: 'ADMIN' });
  const pt = await User.create({ username: 'pt-exercise', password, role: 'PT' });
  const otherPt = await User.create({ username: 'pt-exercise-other', password, role: 'PT' });
  await FeatureFlag.create({ key: 'EXERCISE_LIBRARY', enabled: true, roles: ['ADMIN', 'PT'] });
  adminToken = tokenFor(admin); ptToken = tokenFor(pt); otherPtToken = tokenFor(otherPt);
});
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

it('Admin tạo bài tập dùng chung và PT lọc theo nhóm cơ/level', async () => {
  const created = await request(app).post('/api/exercises').set('Authorization', `Bearer ${adminToken}`).send({
    name: 'Goblet Squat', muscleGroup: 'LEGS', level: 'BEGINNER', equipment: ['DUMBBELL'],
    technique: 'Giữ lưng trung lập.', commonMistakes: ['Gối đổ vào trong'], contraindications: ['Đau gối cấp'], variants: ['Bodyweight Squat'],
  });
  expect(created.status).toBe(201);
  expect(created.body.data).toMatchObject({ scope: 'GLOBAL', muscleGroup: 'LEGS', level: 'BEGINNER' });

  const list = await request(app).get('/api/exercises?page=1&limit=10&muscleGroup=LEGS&level=BEGINNER').set('Authorization', `Bearer ${ptToken}`);
  expect(list.status).toBe(200);
  expect(list.body.meta).toMatchObject({ page: 1, limit: 10, total: 1 });
});

it('PT tạo bài tập riêng nhưng không được tạo bài tập global', async () => {
  const own = await request(app).post('/api/exercises').set('Authorization', `Bearer ${ptToken}`).send({
    name: 'Mobility riêng', muscleGroup: 'FULL_BODY', level: 'BEGINNER', equipment: [], scope: 'PRIVATE',
  });
  expect(own.status).toBe(201);
  expect(own.body.data.scope).toBe('PRIVATE');

  const forbidden = await request(app).post('/api/exercises').set('Authorization', `Bearer ${ptToken}`).send({
    name: 'Global trái phép', muscleGroup: 'CHEST', level: 'BEGINNER', equipment: [], scope: 'GLOBAL',
  });
  expect(forbidden.status).toBe(403);
});

it('PT updates only a private exercise owned by that PT', async () => {
  const created = await request(app).post('/api/exercises').set('Authorization', `Bearer ${ptToken}`).send({
    name: 'Private Row', muscleGroup: 'BACK', level: 'BEGINNER', scope: 'PRIVATE', equipment: [],
  });
  const forbidden = await request(app).patch(`/api/exercises/${created.body.data._id}`).set('Authorization', `Bearer ${otherPtToken}`).send({ name: 'Changed by another PT' });
  expect(forbidden.status).toBe(403);
  const updated = await request(app).patch(`/api/exercises/${created.body.data._id}`).set('Authorization', `Bearer ${ptToken}`).send({ name: 'Private Row Updated', technique: 'Keep the spine neutral.' });
  expect(updated.status).toBe(200);
  expect(updated.body.data).toMatchObject({ name: 'Private Row Updated', scope: 'PRIVATE' });
});

it('supports exercise detail and owner-controlled deletion', async () => {
  const created = await request(app).post('/api/exercises').set('Authorization', `Bearer ${ptToken}`).send({ name: 'Private Press', muscleGroup: 'CHEST', level: 'BEGINNER', scope: 'PRIVATE', equipment: [] });
  const id = created.body.data._id;
  const detail = await request(app).get(`/api/exercises/${id}`).set('Authorization', `Bearer ${ptToken}`);
  expect(detail.status).toBe(200);
  expect(detail.body.data._id).toBe(id);
  expect((await request(app).delete(`/api/exercises/${id}`).set('Authorization', `Bearer ${otherPtToken}`)).status).toBe(403);
  expect((await request(app).delete(`/api/exercises/${id}`).set('Authorization', `Bearer ${ptToken}`)).status).toBe(200);
});

it('stores multiple titled videos and rejects more than 20 videos', async () => {
  const videos = [
    { title: 'Kỹ thuật chuẩn', url: 'https://cdn.example.com/squat.mp4', source: 'UPLOAD' },
    { title: 'Lỗi thường gặp', url: 'https://www.youtube.com/watch?v=squat', source: 'LINK' },
  ];
  const created = await request(app).post('/api/exercises').set('Authorization', `Bearer ${ptToken}`).send({
    name: 'Video Squat', muscleGroup: 'VIDEO_TEST', level: 'BEGINNER', scope: 'PRIVATE', equipment: [], videos,
  });
  expect(created.status).toBe(201);
  expect(created.body.data.videos).toEqual(videos);

  const tooMany = await request(app).post('/api/exercises').set('Authorization', `Bearer ${ptToken}`).send({
    name: 'Too Many Videos', muscleGroup: 'VIDEO_TEST', level: 'BEGINNER', scope: 'PRIVATE', equipment: [],
    videos: Array.from({ length: 21 }, (_, index) => ({ title: `Video ${index + 1}`, url: `https://example.com/${index + 1}.mp4`, source: 'LINK' })),
  });
  expect(tooMany.status).toBe(400);
  expect(tooMany.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'videos' })]));
});

it('normalizes the legacy videoUrl field into the videos response', async () => {
  await Exercise.create({
    name: 'Legacy Video Exercise', muscleGroup: 'LEGACY_VIDEO', level: 'BEGINNER', scope: 'GLOBAL',
    videoUrl: 'https://example.com/legacy.mp4',
  });

  const list = await request(app).get('/api/exercises?muscleGroup=LEGACY_VIDEO').set('Authorization', `Bearer ${ptToken}`);
  expect(list.status).toBe(200);
  expect(list.body.data[0].videos).toEqual([
    { title: 'Video hướng dẫn', url: 'https://example.com/legacy.mp4', source: 'LINK' },
  ]);
});
