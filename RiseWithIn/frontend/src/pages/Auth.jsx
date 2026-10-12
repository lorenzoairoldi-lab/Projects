import { gql, useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Logo from '../components/Logo.jsx';
import { Button, Input, Notice } from '../components/ui.jsx';
import { useAuth } from '../store/auth.js';

const AUTH = gql`mutation Auth($email:String!,$password:String!,$register:Boolean!){register(email:$email,password:$password)@include(if:$register){accessToken refreshToken user{id email plan}}login(email:$email,password:$password)@skip(if:$register){accessToken refreshToken user{id email plan}}}`;

export default function Auth({ register = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [run, state] = useMutation(AUTH);
  const save = useAuth((value) => value.setSession);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    const response = await run({ variables: { email, password, register } });
    save(response.data.register || response.data.login);
    navigate('/dashboard');
  };

  return <main className="grain grid min-h-screen bg-paper lg:grid-cols-2">
    <section className="relative hidden overflow-hidden border-r border-white/10 bg-coal p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute inset-y-0 right-0 w-px bg-fire shadow-[0_0_80px_20px_rgba(255,45,32,.16)]" />
      <Logo light />
      <blockquote className="fit-display max-w-xl text-6xl uppercase leading-[.88]">Non serve vedere tutta la scala.<br /><span className="text-fire">Sali il primo gradino.</span></blockquote>
      <p className="text-sm text-white/40">Uno spazio essenziale per fare ciò che conta.</p>
    </section>
    <section className="grid place-items-center p-5">
      <div className="w-full max-w-md"><div className="mb-12 lg:hidden"><Logo /></div><p className="eyebrow text-fire">{register ? 'Il primo passo' : 'Bentornato'}</p><h1 className="display mt-3 text-5xl">{register ? 'Crea il tuo spazio.' : 'Riprendi da qui.'}</h1><p className="mt-3 text-sm text-white/50">{register ? 'Servono meno di due minuti.' : 'I tuoi progressi ti aspettano.'}</p>
        <form onSubmit={submit} className="mt-9 grid gap-5"><Input label="Email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /><Input label="Password" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required />{state.error && <Notice className="mb-0">{state.error.message}</Notice>}<Button disabled={state.loading} className="mt-2 w-full">{state.loading ? 'Un momento…' : register ? 'Crea account' : 'Accedi'}</Button></form>
        <p className="mt-7 text-center text-sm text-white/50">{register ? 'Hai già un account?' : 'Non hai ancora un account?'} <Link className="font-bold text-fire" to={register ? '/login' : '/register'}>{register ? 'Accedi' : 'Registrati'}</Link></p>
      </div>
    </section>
  </main>;
}
