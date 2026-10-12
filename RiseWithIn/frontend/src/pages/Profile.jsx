import { gql, useMutation, useQuery } from '@apollo/client';
import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { Button, Card, Input, Notice } from '../components/ui.jsx';

const Q = gql`query { profile { displayName bio timezone locale onboardingComplete } }`;
const UPDATE = gql`mutation($input:ProfileInput!){updateProfile(input:$input){displayName bio timezone}}`;

export default function Profile() {
  const { data, error } = useQuery(Q);
  return <>
    <PageHeader eyebrow="Il tuo spazio" title="Profilo" copy="Imposta le preferenze che rendono RiseWithin davvero tuo." />
    {error && <Notice>Non riesco a caricare il profilo.</Notice>}
    {data?.profile && <ProfileForm initial={data.profile} />}
  </>;
}

function ProfileForm({ initial }) {
  const [update, updateState] = useMutation(UPDATE);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(initial);

  const submit = async (event) => {
    event.preventDefault();
    setSaved(false);
    await update({ variables: { input: form } });
    setSaved(true);
  };

  return <>
    {saved && <Notice tone="success">Modifiche salvate.</Notice>}
    <Card className="max-w-2xl">
      <form className="grid gap-5" onSubmit={submit}>
        <Input label="Nome visualizzato" value={form.displayName || ''} onChange={(event) => setForm({ ...form, displayName: event.target.value })} minLength={2} required />
        <label className="grid gap-2 text-sm font-semibold">Bio<textarea className="min-h-28 rounded-2xl border border-white/12 bg-white/[.04] p-4 font-normal" value={form.bio || ''} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label>
        <Input label="Fuso orario" value={form.timezone || ''} onChange={(event) => setForm({ ...form, timezone: event.target.value })} required />
        {updateState.error && <Notice className="mb-0">Non riesco a salvare le modifiche.</Notice>}
        <div><Button disabled={updateState.loading}>{updateState.loading ? 'Salvataggio…' : 'Salva modifiche'}</Button></div>
      </form>
    </Card>
  </>;
}
