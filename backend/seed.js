// Creates the admin account and starter filters. Runs automatically on first start (server.js) or manually with: npm run seed
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Filter } from './models.js';
export async function seed() {
  const a = await User.findOneAndUpdate({ email: 'admin@facefx.com' }, { name: 'Admin', role: 'admin', passwordHash: await bcrypt.hash('admin123', 10) }, { upsert: true, new: true });
  const F = [
    ['Sunglasses', 'overlay', { emoji: '🕶️', anchor: 'eyes', scale: 1.05 }], ['Crown', 'overlay', { emoji: '👑', anchor: 'forehead', scale: 0.9 }],
    ['Clown Nose', 'overlay', { emoji: '🔴', anchor: 'nose', scale: 0.3 }], ['Dog', 'overlay', { emoji: '🐶', anchor: 'forehead', scale: 1.1 }],
    ['Neon', 'color', { grade: 'neon' }], ['Vintage', 'color', { grade: 'vintage' }], ['Cyberpunk', 'color', { grade: 'cyber' }], ['Black & White', 'color', { grade: 'bw' }],
    ['Smile Confetti', 'ai', { trigger: 'smile', effect: 'confetti' }], ['Brow Rainbow', 'ai', { trigger: 'brow', effect: 'rainbow' }], ['Mouth Fire', 'ai', { trigger: 'mouth', effect: 'fire' }]
  ];
  await Filter.deleteMany({});
  await Filter.insertMany(F.map(([name, type, config]) => ({ name, type, category: type, config, createdBy: a._id })));
  console.log('Seeded. Admin login: admin@facefx.com / admin123 (change this password!)');
}
if (process.argv[1]?.endsWith('seed.js')) { await mongoose.connect(process.env.MONGO_URI); await seed(); process.exit(); }
