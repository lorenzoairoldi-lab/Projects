import { motion } from 'motion/react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Activity, BookOpen, Clock3, Goal, House, LogOut, Menu, Repeat2, Users, UserRound, CreditCard, X } from 'lucide-react';
import { useState } from 'react';
import Logo from './Logo.jsx';
import { revokeSession } from '../graphql/client.js';

const links = [
  ['/dashboard', 'Oggi', House], ['/habits', 'Abitudini', Activity], ['/goals', 'Obiettivi', Goal],
  ['/routines', 'Routine', Repeat2], ['/focus', 'Focus', Clock3], ['/content', 'Esplora', BookOpen],
  ['/community', 'Community', Users], ['/subscription', 'Piano', CreditCard], ['/profile', 'Profilo', UserRound]
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  return <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
    <aside className={`fixed inset-y-0 left-0 z-40 w-[280px] border-r border-white/10 bg-coal p-5 text-white transition lg:sticky lg:top-0 lg:block lg:h-screen lg:w-auto ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex items-center justify-between"><Logo light /><button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Chiudi menu"><X /></button></div>
      <p className="mt-10 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-white/40">Il tuo percorso</p>
      <nav className="mt-3 grid gap-1">{links.map(([to, label, Icon]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-fire text-white shadow-sm' : 'text-white/65 hover:translate-x-1 hover:bg-white/10 hover:text-white'}`}><Icon size={18} />{label}</NavLink>)}</nav>
      <button onClick={revokeSession} className="absolute bottom-6 left-5 flex items-center gap-3 px-3 text-sm text-white/55 transition hover:text-white"><LogOut size={18} />Esci</button>
    </aside>
    <main className="grain min-w-0">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-paper/90 px-4 backdrop-blur lg:hidden"><Logo /><button onClick={() => setOpen(true)} aria-label="Apri menu"><Menu /></button></header>
      <motion.div key={location.pathname} className="mx-auto max-w-[1280px] p-4 sm:p-7 lg:p-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
        <Outlet />
      </motion.div>
    </main>
  </div>;
}
