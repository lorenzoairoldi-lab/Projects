import { motion, useReducedMotion } from 'motion/react';
import { ArrowDownRight, ArrowRight, Clock3, Flame, Sunrise } from 'lucide-react';
import { Link } from 'react-router-dom';
import GrowthScene from '../components/GrowthScene.jsx';
import Logo from '../components/Logo.jsx';
import Reveal from '../components/Reveal.jsx';

const principles = [
  ['Osserva', 'Rendi visibile dove vanno davvero attenzione ed energia.'],
  ['Scegli', 'Trasforma ciò che conta in un gesto abbastanza piccolo da iniziare.'],
  ['Continua', 'Usa i dati per orientarti, mai per giudicarti.']
];

const journey = [
  { icon: Sunrise, time: '07:00', title: 'Routine del mattino', detail: '4 di 5 completate' },
  { icon: Clock3, time: '09:30', title: 'Focus profondo', detail: '25 minuti protetti' },
  { icon: Flame, time: '18:00', title: 'Camminata', detail: 'Streak di 12 giorni' }
];

export default function Home() {
  const reducedMotion = useReducedMotion();
  return <div className="min-h-screen overflow-hidden bg-[#070708] text-white">
    <nav className="absolute inset-x-0 top-0 z-30 mx-auto flex max-w-[1480px] items-center justify-between px-5 py-6 sm:px-8">
      <Logo light />
      <div className="hidden items-center gap-8 text-[11px] font-bold uppercase tracking-[.16em] text-white/50 md:flex"><a href="#metodo" className="hover:text-white">Il metodo</a><a href="#giornata" className="hover:text-white">La giornata</a></div>
      <div className="flex items-center gap-2"><Link className="hidden px-3 text-xs font-bold uppercase tracking-wider text-white/60 sm:block" to="/login">Accedi</Link><Link to="/register" className="inline-flex min-h-11 items-center rounded-full bg-fire px-5 text-sm font-bold text-white transition hover:bg-red-600">Inizia ora</Link></div>
    </nav>

    <main>
      <section className="relative isolate min-h-[900px] border-b border-white/10 pt-28 lg:min-h-screen">
        <div className="fit-grid absolute inset-0 -z-20" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_74%_42%,rgba(255,45,32,.16),transparent_28%)]" />
        <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-[1480px] items-center px-5 sm:px-8 lg:grid-cols-[1.1fr_.9fr]">
          <motion.div className="relative z-10 py-16" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : .8 }}>
            <p className="mb-8 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.22em] text-white/45"><span className="h-px w-10 bg-fire" />Sistema personale di crescita</p>
            <h1 className="fit-display max-w-5xl text-[clamp(4.5rem,10.5vw,10rem)] uppercase leading-[.75] tracking-[-.075em]">Diventa<br />chi ti<br /><span className="text-fire">prometti.</span></h1>
            <div className="mt-10 grid max-w-2xl gap-7 border-t border-white/15 pt-7 sm:grid-cols-[1fr_auto] sm:items-end">
              <p className="max-w-md text-sm leading-7 text-white/55 sm:text-base">Meno rumore, più presenza. Trasforma intenzioni, focus e routine in un avanzamento visibile ogni giorno.</p>
              <Link to="/register" className="group inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[.16em]">Crea il tuo percorso<span className="grid size-12 place-items-center rounded-full bg-fire transition group-hover:-rotate-45 group-hover:bg-white group-hover:text-black"><ArrowDownRight size={19} /></span></Link>
            </div>
          </motion.div>
          <div className="relative h-[500px] lg:h-[720px]"><GrowthScene reducedMotion={reducedMotion} /></div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-fire/50 bg-fire py-4">
        <div className="ticker-track flex w-max whitespace-nowrap">{[...Array(2)].flatMap(() => ['ABITUDINI', 'FOCUS', 'OBIETTIVI', 'ROUTINE', 'CRESCITA REALE']).map((item, index) => <span key={`${item}-${index}`} className="fit-display flex items-center text-2xl uppercase sm:text-4xl">{item}<span className="mx-7 size-2 bg-black sm:mx-10" /></span>)}</div>
      </div>

      <section id="metodo" className="border-b border-white/10 bg-[#0b0b0d] py-24 sm:py-32">
        <div className="mx-auto max-w-[1480px] px-5 sm:px-8">
          <Reveal className="grid gap-10 lg:grid-cols-[.38fr_1fr]"><p className="eyebrow text-white/40">Il metodo</p><h2 className="fit-display max-w-5xl text-[clamp(3.4rem,7vw,7rem)] uppercase leading-[.84] tracking-[-.06em]">La motivazione passa.<br /><span className="text-fire">Il sistema resta.</span></h2></Reveal>
          <div className="mt-20 grid border-y border-white/10 lg:grid-cols-3">
            {principles.map(([title, copy], index) => <motion.article key={title} className="group relative min-h-[340px] border-b border-white/10 p-7 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reducedMotion ? 0 : index * .1 }}>
              <span className="text-[10px] font-bold tracking-[.2em] text-fire">0{index + 1} / 03</span><span className="absolute right-7 top-7 grid size-10 place-items-center rounded-full border border-white/15 transition group-hover:border-fire group-hover:bg-fire"><ArrowDownRight size={17} /></span>
              <div className="absolute inset-x-7 bottom-8"><h3 className="fit-display text-5xl uppercase">{title}</h3><p className="mt-5 max-w-sm leading-7 text-white/50">{copy}</p></div>
            </motion.article>)}
          </div>
        </div>
      </section>

      <section id="giornata" className="bg-[#080809] py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1480px] gap-16 px-5 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <Reveal><p className="eyebrow text-fire">La tua giornata</p><h2 className="fit-display mt-9 text-[clamp(4rem,8vw,8rem)] uppercase leading-[.78] tracking-[-.065em]">Un ritmo.<br />Un solo<br /><span className="text-fire">sguardo.</span></h2><p className="mt-8 max-w-md leading-7 text-white/50">Routine, focus e piccole promesse convivono nello stesso spazio. Ogni segnale serve a scegliere cosa viene dopo.</p></Reveal>
          <Reveal delay={.12} className="relative"><div className="absolute -inset-5 rotate-2 border border-fire/30" /><div className="relative border border-white/10 bg-[#111113] p-6 shadow-2xl sm:p-10">
            <div className="flex items-start justify-between border-b border-white/10 pb-7"><div><p className="text-[9px] font-bold uppercase tracking-[.2em] text-white/35">Oggi</p><h3 className="fit-display mt-2 text-4xl uppercase">La tua giornata</h3></div><div className="grid size-16 place-items-center rounded-full border border-fire text-fire"><span className="fit-display text-2xl">72%</span></div></div>
            <div className="relative py-3 before:absolute before:bottom-10 before:left-[21px] before:top-10 before:w-px before:bg-white/10">{journey.map(({ icon: Icon, time, title, detail }, index) => <div key={title} className="relative flex gap-5 py-5"><div className={`z-10 grid size-11 shrink-0 place-items-center rounded-full ${index === 2 ? 'bg-fire' : 'bg-white text-black'}`}><Icon size={17} /></div><div><p className="text-[9px] font-bold uppercase tracking-widest text-white/35">{time}</p><h4 className="mt-1 font-bold">{title}</h4><p className="mt-1 text-xs text-white/45">{detail}</p></div></div>)}</div>
          </div></Reveal>
        </div>
      </section>

      <section className="border-t border-white/10 bg-fire px-5 py-24 sm:px-8"><Reveal className="mx-auto flex max-w-[1480px] flex-col items-start justify-between gap-10 lg:flex-row lg:items-end"><h2 className="fit-display text-[clamp(4rem,8vw,8rem)] uppercase leading-[.78] tracking-[-.065em]">Comincia da<br /><span className="text-black">oggi.</span></h2><Link to="/register" className="inline-flex min-h-16 items-center gap-2 rounded-full bg-black px-8 text-sm font-bold text-white transition hover:bg-white hover:text-black">Crea il tuo spazio <ArrowRight size={19} /></Link></Reveal></section>
    </main>
    <footer className="bg-[#070708] px-5 py-10 sm:px-8"><div className="mx-auto flex max-w-[1480px] flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between"><Logo light /><p className="text-xs text-white/35">© 2026 RiseWithin. Cresci al tuo ritmo.</p></div></footer>
  </div>;
}
