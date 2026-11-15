// Application layer: all REST endpoints (Auth, Filter, Photo, Admin controllers)
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User, Filter, Photo, Favorite, UsageLog } from './models.js';
import { sign, auth, admin } from './middleware.js';
const r = Router(), wrap = f => (q, s, n) => f(q, s, n).catch(e => s.status(400).json({ error: e.message }));

// ---- Auth ----
r.post('/auth/register', wrap(async (q, s) => {
  const { name, email, password } = q.body;
  if (!name || !email || !password || password.length < 6) throw new Error('Name, email and a 6+ character password are required');
  if (await User.findOne({ email })) throw new Error('Email already registered');
  const u = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
  s.status(201).json({ token: sign(u), user: { name, email, role: u.role } });
}));
r.post('/auth/login', wrap(async (q, s) => {
  const u = await User.findOne({ email: q.body.email });
  if (!u || !(await bcrypt.compare(q.body.password || '', u.passwordHash))) return s.status(401).json({ error: 'Wrong email or password' });
  s.json({ token: sign(u), user: { name: u.name, email: u.email, role: u.role } });
}));

// ---- Filters ----
r.get('/filters', wrap(async (q, s) => s.json(await Filter.find({ isActive: true }))));
r.get('/filters/:id', wrap(async (q, s) => s.json(await Filter.findById(q.params.id))));
r.post('/filters', auth, admin, wrap(async (q, s) => s.status(201).json(await Filter.create({ ...q.body, createdBy: q.user.id }))));
r.put('/filters/:id', auth, admin, wrap(async (q, s) => s.json(await Filter.findByIdAndUpdate(q.params.id, q.body, { new: true }))));
r.delete('/filters/:id', auth, admin, wrap(async (q, s) => { await Filter.findByIdAndDelete(q.params.id); s.json({ ok: true }); }));
r.post('/favorites', auth, wrap(async (q, s) => s.status(201).json(await Favorite.create({ userId: q.user.id, filterId: q.body.filterId }))));
r.post('/usage', auth, wrap(async (q, s) => { await UsageLog.create({ userId: q.user.id, filterId: q.body.filterId, action: 'use' }); s.json({ ok: true }); }));

// ---- Photos ----
r.post('/photos', auth, wrap(async (q, s) => {
  const p = await Photo.create({ userId: q.user.id, filterId: q.body.filterId, imageData: q.body.imageData });
  await UsageLog.create({ userId: q.user.id, filterId: q.body.filterId, action: 'capture' });
  s.status(201).json({ id: p._id });
}));
r.get('/photos', auth, wrap(async (q, s) => s.json(await Photo.find({ userId: q.user.id }).sort('-createdAt'))));
r.delete('/photos/:id', auth, wrap(async (q, s) => { await Photo.deleteOne({ _id: q.params.id, userId: q.user.id }); s.json({ ok: true }); }));

// ---- Admin ----
r.get('/admin/users', auth, admin, wrap(async (q, s) => s.json(await User.find().select('-passwordHash'))));
r.delete('/admin/users/:id', auth, admin, wrap(async (q, s) => { await User.findByIdAndDelete(q.params.id); s.json({ ok: true }); }));
r.get('/admin/stats', auth, admin, wrap(async (q, s) => s.json({
  users: await User.countDocuments(), filters: await Filter.countDocuments(), photos: await Photo.countDocuments(),
  topFilters: await UsageLog.aggregate([{ $group: { _id: '$filterId', uses: { $sum: 1 } } }, { $sort: { uses: -1 } }, { $limit: 5 }])
})));
export default r;
