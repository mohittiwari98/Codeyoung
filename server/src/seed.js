import 'dotenv/config';
import mongoose from 'mongoose';
import { Mentor } from './models.js';
import { MENTORS } from './mentors.js';

export async function ensureMentors() {
  for (const { id, ...m } of MENTORS) await Mentor.updateOne({ email: m.email }, { $set: m }, { upsert: true });
}

if (process.argv[1].endsWith('seed.js')) {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codeyoung_trials');
  await ensureMentors();
  console.log(`Seeded ${MENTORS.length} mentors`);
  await mongoose.disconnect();
}
