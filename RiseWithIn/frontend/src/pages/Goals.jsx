import { gql, useMutation, useQuery } from '@apollo/client';
import { Check, Plus, Target } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { Button, Card, Empty, Input, Modal, Notice } from '../components/ui.jsx';

const Q = gql`query { goals { items { id title description category targetDate progress milestones { id title completed } } } }`;
const CREATE = gql`mutation($input:GoalInput!){createGoal(input:$input){id}}`;
const ADD = gql`mutation($id:ID!,$input:MilestoneInput!){addMilestone(goalId:$id,input:$input){id}}`;
const TOGGLE = gql`mutation($id:ID!){toggleMilestone(id:$id){id progress}}`;

export default function Goals() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState('');
  const [milestone, setMilestone] = useState('');
  const { data, loading, error, refetch } = useQuery(Q);
  const [create, createState] = useMutation(CREATE);
  const [add, addState] = useMutation(ADD);
  const [toggle] = useMutation(TOGGLE);

  const submitGoal = async (event) => {
    event.preventDefault();
    await create({ variables: { input: { title, category: 'PERSONAL' } } });
    setOpen(false);
    setTitle('');
    await refetch();
  };

  const submitMilestone = async (event) => {
    event.preventDefault();
    await add({ variables: { id: selected.id, input: { title: milestone } } });
    setMilestone('');
    setSelected(null);
    await refetch();
  };

  return <>
    <PageHeader eyebrow="Dai un nome alla direzione" title="Obiettivi" copy="Un buon obiettivo chiarisce il prossimo passo, non mette pressione sul traguardo." action={<Button onClick={() => setOpen(true)}><Plus size={17} />Nuovo obiettivo</Button>} />
    {error && <Notice>Non riesco a caricare gli obiettivi. Riprova tra poco.</Notice>}
    {!loading && !error && !data?.goals.items.length
      ? <Empty title="Quale direzione vuoi scegliere?" copy="Scrivi un risultato che abbia significato per te." action={<Button onClick={() => setOpen(true)}>Crea il primo obiettivo</Button>} />
      : <div className="grid gap-5 lg:grid-cols-2">
        {data?.goals.items.map((goal) => <Card key={goal.id}>
          <div className="flex justify-between"><Target className="text-fire" /><span className="display text-4xl">{goal.progress}%</span></div>
          <h2 className="display mt-6 text-3xl">{goal.title}</h2>
          <p className="mt-2 text-sm text-white/50">{goal.description || goal.category}</p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-fire" style={{ width: `${goal.progress}%` }} /></div>
          <div className="mt-5 space-y-2">
            {goal.milestones.map((item) => <button
              key={item.id}
              onClick={async () => { await toggle({ variables: { id: item.id } }); await refetch(); }}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left text-sm hover:bg-white/5"
            >
              <span className={`grid size-6 place-items-center rounded-full border ${item.completed ? 'border-fire bg-fire' : 'border-white/20'}`}>{item.completed && <Check size={13} />}</span>
              <span className={item.completed ? 'line-through opacity-45' : ''}>{item.title}</span>
            </button>)}
            {!goal.milestones.length && <p className="text-sm text-white/40">Aggiungi un passo misurabile per far avanzare il progresso.</p>}
          </div>
          <Button variant="secondary" className="mt-4 w-full" onClick={() => setSelected(goal)}><Plus size={16} />Aggiungi milestone</Button>
        </Card>)}
      </div>}

    <Modal open={open} onClose={() => setOpen(false)} title="Nuovo obiettivo">
      <form onSubmit={submitGoal} className="grid gap-5">
        <Input label="Cosa vuoi rendere possibile?" value={title} onChange={(event) => setTitle(event.target.value)} required />
        {createState.error && <Notice className="mb-0">Non riesco a creare l’obiettivo.</Notice>}
        <Button disabled={createState.loading}>Salva obiettivo</Button>
      </form>
    </Modal>
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={`Nuova milestone · ${selected?.title || ''}`}>
      <form onSubmit={submitMilestone} className="grid gap-5">
        <Input label="Qual è il prossimo risultato visibile?" value={milestone} onChange={(event) => setMilestone(event.target.value)} required />
        {addState.error && <Notice className="mb-0">Non riesco ad aggiungere la milestone.</Notice>}
        <Button disabled={addState.loading}>Aggiungi milestone</Button>
      </form>
    </Modal>
  </>;
}
