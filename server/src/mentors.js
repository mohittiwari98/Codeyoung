const names = ['Aarav', 'Diya', 'Rohan', 'Ananya', 'Kabir', 'Isha', 'Vihaan', 'Meera', 'Arjun', 'Sanya'];
export const MENTORS = names.map((n, i) => ({
  id: i + 1,
  name: `${n} Sharma`,
  email: `${n.toLowerCase()}@mentors.example.com`,
  tz: 'Asia/Kolkata',
  workStart: 9, // local hour
  workEnd: 21,
}));
