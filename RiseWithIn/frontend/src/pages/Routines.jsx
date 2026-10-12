import { gql, useMutation, useQuery } from '@apollo/client';
import { Check, Moon, Plus, Sun } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { Button, Card, Empty, Input, Modal, Notice } from '../components/ui.jsx';

const Q = gql`query { routines { id name period scheduledTime tasks { id title completed durationMinutes } } }`;
const CREATE = gql`mutation($input:RoutineInput!){createRoutine(input:$input){id}}`;
const ADD = gql`mutation($id:ID!,$input:RoutineTaskInput!){addRoutineTask(routineId:$id,input:$input){id}}`;
const TOGGLE = gql`mutation($id:ID!){toggleRoutineTask(id:$id){id}}`;

export default function Routines() {
  const [open, setOpen] = useState(false);
  const [taskRoutine, setTaskRoutine] = useState(null);
  const [form, setForm] = useState({ name: '', period: 'MORNING', scheduledTime: '07:00' });
  const [taskTitle, setTaskTitle] = useState('');
  const { data, loading, error, refetch } = useQuery(Q);
  const [create, createState] = useMutation(CREATE);
  const [add, addState] = useMutation(ADD);
  const [toggle] = useMutation(TOGGLE);

  const createRoutine = async (event) => {
    event.preventDefault();
    await create({ variables: { input: form } });
    setForm({ name: '', period: 'MORNING', scheduledTime: '07:00' });
    setOpen(false);
    await refetch();
  };

  const addTask = async (event) => {
    event.preventDefault();
    await add({ variables: { id: taskRoutine.id, input: { title: taskTitle, durationMinutes: 5, position: taskRoutine.tasks.length } } });
    setTaskTitle('');
    setTaskRoutine(null);
    await refetch();
  };

  return <>
    <PageHeader eyebrow="Inizia e chiudi bene" title="Routine" copy="Sequenze leggere che riducono le decisioni e proteggono la tua energia." action={<Button onClick={() => setOpen(true)}><Plus size={17} />Nuova routine</Button>} />
    {error && <Notice>Non riesco a caricare le routine. Riprova tra poco.</Notice>}
    {!loading && !error && !data?.routines.length
      ? <Empty title="Costruisci il tuo primo ritmo" copy="Crea una routine, poi aggiungi i passi che vuoi rendere automatici." action={<Button onClick={() => setOpen(true)}>Crea una routine</Button>} />
      : <div className="grid gap-5 lg:grid-cols-2">
        {data?.routines.map((routine) => <Card key={routine.id} className={routine.period === 'MORNING' ? 'bg-[#171315]' : 'bg-[#09090a]'}>
          <div className="flex items-center justify-between text-white/70">{routine.period === 'MORNING' ? <Sun className="text-fire" /> : <Moon className="text-fire" />}<b>{routine.scheduledTime}</b></div>
          <h2 className="display mt-7 text-4xl">{routine.name}</h2>
          <div className="mt-6 space-y-2">
            {routine.tasks.map((task, index) => <button
              key={task.id}
              onClick={async () => { await toggle({ variables: { id: task.id } }); await refetch(); }}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/5"
            >
              <span className={`grid size-7 place-items-center rounded-full border text-xs ${task.completed ? 'border-fire bg-fire text-white' : 'border-white/20'}`}>{task.completed ? <Check size={14} /> : index + 1}</span>
              <span className={task.completed ? 'line-through opacity-45' : ''}>{task.title}</span>
              <small className="ml-auto opacity-45">{task.durationMinutes}m</small>
            </button>)}
            {!routine.tasks.length && <p className="py-3 text-sm text-white/45">Aggiungi il primo passo della routine.</p>}
          </div>
          <Button variant="secondary" className="mt-5 w-full" onClick={() => setTaskRoutine(routine)}><Plus size={16} />Aggiungi un passo</Button>
        </Card>)}
      </div>}

    <Modal open={open} onClose={() => setOpen(false)} title="Nuova routine">
      <form className="grid gap-5" onSubmit={createRoutine}>
        <Input label="Nome" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <label className="grid gap-2 text-sm font-semibold">Momento
          <select className="min-h-12 rounded-2xl border border-white/12 bg-[#151517] px-4" value={form.period} onChange={(event) => setForm({ ...form, period: event.target.value })}>
            <option value="MORNING">Mattina</option><option value="EVENING">Sera</option><option value="CUSTOM">Personalizzata</option>
          </select>
        </label>
        <Input label="Orario" type="time" value={form.scheduledTime} onChange={(event) => setForm({ ...form, scheduledTime: event.target.value })} required />
        {createState.error && <Notice className="mb-0">Non riesco a creare la routine.</Notice>}
        <Button disabled={createState.loading}>Salva routine</Button>
      </form>
    </Modal>

    <Modal open={Boolean(taskRoutine)} onClose={() => setTaskRoutine(null)} title={`Nuovo passo · ${taskRoutine?.name || ''}`}>
      <form className="grid gap-5" onSubmit={addTask}>
        <Input label="Cosa vuoi fare?" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="es. Preparare la giornata" required />
        {addState.error && <Notice className="mb-0">Non riesco ad aggiungere questo passo.</Notice>}
        <Button disabled={addState.loading}>Aggiungi passo</Button>
      </form>
    </Modal>
  </>;
}
