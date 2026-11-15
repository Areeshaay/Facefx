import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import routes from './routes.js';
import { Filter } from './models.js';
import { seed } from './seed.js';
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: '2mb' }));
app.get('/', (q, s) => s.send('FaceFX API running'));
app.use('/api', routes);
await mongoose.connect(process.env.MONGO_URI);
if (!(await Filter.countDocuments())) await seed();   // first start: create admin + starter filters
app.listen(process.env.PORT || 5000, () => console.log('FaceFX API on port', process.env.PORT || 5000));
