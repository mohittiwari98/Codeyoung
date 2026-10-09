import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { createBookingService } from './bookingService.js';
import { Booking, MentorDay } from './models.js';
import { ensureMentors } from './seed.js';

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codeyoung_trials');
await Promise.all([Booking.init(), MentorDay.init()]); // make sure unique indexes exist
await ensureMentors();
const port = Number(process.env.PORT) || 4000;
createApp(createBookingService()).listen(port, () => console.log(`API on http://localhost:${port}`));
