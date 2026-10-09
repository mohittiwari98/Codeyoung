import { useEffect, useRef, useState } from 'react';
import { initials } from '../lib.js';
import { Icon, icons, Logo } from './ui.jsx';

const SCRIPT = [
  [1200, 'mentor', 'Hi! Welcome to your Codeyoung trial class 👋'],
  [4500, 'mentor', "I'm so happy you're here. Today we'll build something fun in about 30 minutes."],
  [9000, 'mentor', "Let's start by making a colourful spiral. Watch the code on the right!"],
  [15000, 'mentor', 'Try changing the number 5 to 20. What happens? 🤔'],
  [21000, 'mentor', 'Great job! That is how coders experiment and learn.'],
];
const CODE = `import turtle

t = turtle.Turtle()
colors = ["gold", "orange", "teal", "navy"]

for i in range(60):
    t.color(colors[i % 4])
    t.forward(i * 5)
    t.left(91)

# Press Run to see your spiral!`;

const pad = (n) => String(n).padStart(2, '0');
const ctl = 'grid h-12 w-12 place-items-center rounded-full transition';

export default function Classroom({ route, onExit }) {
  const [phase, setPhase] = useState('lobby'); // lobby | live | ended
  const [secs, setSecs] = useState(0);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(false);
  const [hand, setHand] = useState(false);
  const [chat, setChat] = useState([]);
  const [msg, setMsg] = useState('');
  const [typed, setTyped] = useState(0);
  const chatEnd = useRef(null);

  useEffect(() => { const t = setTimeout(() => setPhase('live'), 2600); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (phase !== 'live') return;
    const timers = SCRIPT.map(([ms, from, text]) => setTimeout(() => setChat((c) => [...c, { from, text }]), ms));
    const clock = setInterval(() => setSecs((s) => s + 1), 1000);
    const type = setInterval(() => setTyped((n) => Math.min(n + 2, CODE.length)), 60);
    return () => { timers.forEach(clearTimeout); clearInterval(clock); clearInterval(type); };
  }, [phase]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [chat]);

  const send = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setChat((c) => [...c, { from: 'you', text: msg.trim() }]);
    setMsg('');
  };

  if (phase === 'ended') return (
    <div className="grid min-h-screen place-items-center bg-ink-950 p-6 text-center text-white">
      <div className="max-w-md animate-fade-up">
        <div className="animate-pop mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-3xl">🎉</div>
        <h1 className="text-3xl font-extrabold">Thanks for joining!</h1>
        <p className="mt-2 text-ink-300">This was a demo classroom. In a real class, {route.mentor} would help your child build their first project.</p>
        <button onClick={onExit} className="mt-6 rounded-xl btn-brand px-6 py-3">Back to booking</button>
      </div>
    </div>
  );

  if (phase === 'lobby') return (
    <div className="grid min-h-screen place-items-center bg-ink-950 p-6 text-center text-white">
      <div className="animate-fade-up">
        <div className="relative mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-brand-300 to-orange-logo text-3xl font-bold text-ink-900">
          <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/40" />
          <span className="relative">{initials(route.mentor)}</span>
        </div>
        <h1 className="text-2xl font-bold">Joining your trial class…</h1>
        <p className="mt-2 text-ink-500">{route.mentor} is getting the classroom ready</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-ink-950 text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-4"><Logo dark /><span className="hidden text-sm text-ink-500 sm:block">Free trial class · Demo classroom</span></div>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1 text-rose-300"><span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" /> LIVE</span>
          <span className="tabular-nums text-ink-300">{pad(Math.floor(secs / 60))}:{pad(secs % 60)} / 30:00</span>
        </div>
      </header>

      <div className="grid flex-1 gap-3 p-3 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-3">
          <div className="relative grid min-h-64 flex-1 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-ink-700 via-ink-800 to-ink-900">
            <div className="relative grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-brand-300 to-orange-logo text-4xl font-bold text-ink-900 shadow-2xl">
              <span className="absolute -inset-3 animate-pulse rounded-full border-2 border-brand-300/50" />
              {initials(route.mentor)}
            </div>
            <span className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-2.5 py-1 text-sm font-semibold">{route.mentor} · Mentor</span>
            <div className="absolute bottom-3 right-3 grid h-24 w-36 place-items-center rounded-xl border border-white/10 bg-ink-800 text-sm shadow-lg">
              {cam ? <span className="text-3xl">🙂</span> : <span className="text-ink-500">You · camera off</span>}
            </div>
            {hand && <span className="absolute right-3 top-3 animate-pop rounded-full bg-amber-400 px-3 py-1 text-sm font-bold text-ink-900">✋ Hand raised</span>}
          </div>

          <div className="rounded-2xl border border-white/10 bg-ink-900 p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-ink-500">
              <span className="font-semibold">spiral.py</span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-300">Shared by {route.mentor.split(' ')[0]}</span>
            </div>
            <pre className="min-h-52 overflow-x-auto font-mono text-sm leading-relaxed text-emerald-200">{CODE.slice(0, typed)}<span className="animate-pulse">▌</span></pre>
          </div>
        </div>

        <aside className="flex min-h-80 flex-col rounded-2xl border border-white/10 bg-ink-900">
          <h2 className="border-b border-white/10 px-4 py-3 text-sm font-bold">Class chat</h2>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 lg:max-h-[60vh]" aria-live="polite">
            {chat.map((c, i) => (
              <div key={i} className={'animate-fade-up flex ' + (c.from === 'you' ? 'justify-end' : '')}>
                <p className={'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ' + (c.from === 'you' ? 'bg-brand-400 text-ink-900' : 'bg-ink-800')}>{c.text}</p>
              </div>
            ))}
            <div ref={chatEnd} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3">
            <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message…" aria-label="Message"
              className="min-w-0 flex-1 rounded-xl bg-ink-800 px-3 py-2.5 text-sm placeholder:text-ink-500" />
            <button className="btn-brand px-4 text-sm">Send</button>
          </form>
        </aside>
      </div>

      <footer className="flex items-center justify-center gap-3 border-t border-white/10 p-3">
        <button className={ctl + (mic ? ' bg-ink-700 hover:bg-ink-600' : ' bg-rose-600')} onClick={() => setMic(!mic)} aria-pressed={!mic} aria-label={mic ? 'Mute microphone' : 'Unmute microphone'}>{mic ? '🎤' : '🔇'}</button>
        <button className={ctl + (cam ? ' bg-ink-700 hover:bg-ink-600' : ' bg-rose-600')} onClick={() => setCam(!cam)} aria-pressed={!cam} aria-label={cam ? 'Turn camera off' : 'Turn camera on'}><Icon d={icons.video} className="h-5 w-5" /></button>
        <button className={ctl + (hand ? ' bg-amber-400' : ' bg-ink-700 hover:bg-ink-600')} onClick={() => setHand(!hand)} aria-pressed={hand} aria-label="Raise hand">✋</button>
        <button onClick={() => setPhase('ended')} className="h-12 rounded-full bg-rose-600 px-6 font-bold hover:bg-rose-500">Leave</button>
      </footer>
    </div>
  );
}
