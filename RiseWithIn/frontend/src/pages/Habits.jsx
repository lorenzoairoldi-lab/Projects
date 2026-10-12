import { gql, useMutation, useQuery } from '@apollo/client';
import { Check, Flame, Plus, Undo2 } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { Button, Card, Empty, Input, Modal, Notice } from '../components/ui.jsx';

const Q = gql`query Habits { habits { items { id name description color completedToday currentStreak bestStreak completionRate } } }`;
const CREATE = gql`mutation($input:HabitInput!){createHabit(input:$input){id name}}`;
const DONE = gql`mutation($id:ID!){completeHabit(id:$id){id}}`;
const UNDO = gql`mutation($id:ID!){uncompleteHabit(id:$id)}`;

export default function Habits() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const { data, loading, error, refetch } = useQuery(Q);
  const [create, createState] = useMutation(CREATE);
  const [done] = useMutation(DONE);
  const [undo] = useMutation(UNDO);

  const submit = async (event) => {
    event.preventDefault();
    await create({ variables: { input: { name, color: '#FF2D20', frequency: 'DAILY', targetPerWeek: 7 } } });
    setName('');
    setOpen(false);
    setMessage('Abitudine creata.');
    await refetch();
  };

  const toggle = async (habit) => {
    setMessage('');
    if (habit.completedToday) await undo({ variables: { id: habit.id } });
    else await done({ variables: { id: habit.id } });
    await refetch();
  };

  return <>
    <PageHeader eyebrow="Piccole promesse mantenute" title="Abitudini" copy="La costanza non è rigidità: è tornare, anche dopo una pausa." action={<Button onClick={() => setOpen(true)}><Plus size={17} />Nuova abitudine</Button>} />
    {error && <Notice>Non riesco a caricare le abitudini. Controlla la connessione e riprova.</Notice>}
    {message && <Notice tone="success">{message}</Notice>}
    {!loading && !error && !data?.habits.items.length
      ? <Empty title="Inizia da una cosa piccola" copy="Scegli un gesto che richieda meno di due minuti." action={<Button onClick={() => setOpen(true)}>Crea la prima</Button>} />
      : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.habits.items.map((habit) => <Card key={habit.id} className={habit.completedToday ? 'border-fire/45 bg-fire/[.06]' : ''}>
          <div className="flex items-start justify-between">
            <span className="size-4 rounded-full" style={{ background: habit.color }} />
            <button
              aria-label={habit.completedToday ? `Annulla completamento di ${habit.name}` : `Completa ${habit.name}`}
              aria-pressed={habit.completedToday}
              onClick={() => toggle(habit)}
              className={`grid size-10 place-items-center rounded-full border transition ${habit.completedToday ? 'border-fire bg-fire text-white' : 'border-white/15 hover:border-fire hover:text-fire'}`}
            >{habit.completedToday ? <Undo2 size={16} /> : <Check size={17} />}</button>
          </div>
          <h2 className="display mt-6 text-3xl">{habit.name}</h2>
          <p className="mt-2 min-h-10 text-sm text-white/50">{habit.description || 'Un gesto scelto con intenzione.'}</p>
          <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-5">
            <div><p className="eyebrow">Streak</p><p className="mt-1 flex items-center gap-1 font-bold"><Flame size={16} className="text-fire" />{habit.currentStreak} giorni</p></div>
            <span className="display text-3xl">{Math.round(habit.completionRate)}%</span>
          </div>
        </Card>)}
      </div>}
    <Modal open={open} onClose={() => setOpen(false)} title="Nuova abitudine">
      <form className="grid gap-5" onSubmit={submit}>
        <Input label="Come la vuoi chiamare?" value={name} onChange={(event) => setName(event.target.value)} placeholder="es. Leggere due pagine" required />
        {createState.error && <Notice className="mb-0">Non riesco a salvare l’abitudine. Riprova.</Notice>}
        <Button disabled={createState.loading}>{createState.loading ? 'Salvataggio…' : 'Salva abitudine'}</Button>
      </form>
    </Modal>
  </>;
}
