import { gql, useMutation, useQuery } from '@apollo/client';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { Button, Card, Notice } from '../components/ui.jsx';
import { useTimer } from '../hooks/useTimer.js';

const Q = gql`query { focusStats { todayMinutes weekMinutes completedSessions } }`;
const START = gql`mutation($minutes:Int!){startFocusSession(mode:POMODORO,minutes:$minutes){id}}`;
const PAUSE = gql`mutation($id:ID!){pauseFocusSession(id:$id){id}}`;
const RESUME = gql`mutation($id:ID!){resumeFocusSession(id:$id){id}}`;
const END = gql`mutation($id:ID!){completeFocusSession(id:$id){id actualMinutes}}`;

export default function Focus() {
  const timer = useTimer(1500);
  const { reset } = timer;
  const [sessionId, setSessionId] = useState(null);
  const completing = useRef(false);
  const [message, setMessage] = useState('');
  const { data, error, refetch } = useQuery(Q);
  const [start, { loading: starting }] = useMutation(START);
  const [pause] = useMutation(PAUSE);
  const [resume] = useMutation(RESUME);
  const [end] = useMutation(END);

  const complete = useCallback(async (automatic = false) => {
    if (!sessionId || completing.current) return;
    completing.current = true;
    try {
      await end({ variables: { id: sessionId } });
      setSessionId(null);
      reset();
      setMessage(automatic ? 'Sessione completata: ottimo lavoro.' : 'Sessione registrata.');
      await refetch();
    } finally {
      completing.current = false;
    }
  }, [end, refetch, reset, sessionId]);

  useEffect(() => {
    if (timer.seconds === 0 && sessionId) complete(true);
  }, [timer.seconds, sessionId, complete]);

  const toggle = async () => {
    setMessage('');
    if (!sessionId) {
      const response = await start({ variables: { minutes: 25 } });
      setSessionId(response.data.startFocusSession.id);
      timer.setRunning(true);
      return;
    }
    if (timer.running) {
      await pause({ variables: { id: sessionId } });
      timer.setRunning(false);
    } else {
      await resume({ variables: { id: sessionId } });
      timer.setRunning(true);
    }
  };

  const mm = String(Math.floor(timer.seconds / 60)).padStart(2, '0');
  const ss = String(timer.seconds % 60).padStart(2, '0');

  return <>
    <PageHeader eyebrow="Uno spazio senza interruzioni" title="Focus" copy="Scegli una cosa. Il resto può aspettare." />
    {(error || message) && <Notice tone={error ? 'error' : 'success'}>{error ? 'Non riesco a caricare le statistiche. Riprova tra poco.' : message}</Notice>}
    <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <Card className="grid min-h-[480px] place-items-center bg-coal text-white">
        <div className="text-center">
          <p className="eyebrow text-white/45">Pomodoro · 25 minuti</p>
          <div className="display my-10 text-[92px] leading-none sm:text-[150px]">{mm}<span className="text-fire">:</span>{ss}</div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button disabled={starting} onClick={toggle} className="bg-white text-coal hover:bg-fire hover:text-white">
              {timer.running ? <><Pause />Pausa</> : <><Play />{sessionId ? 'Riprendi' : 'Inizia'}</>}
            </Button>
            <Button disabled={!sessionId} onClick={() => complete(false)} variant="secondary" className="border-white/20 bg-transparent text-white">
              <RotateCcw size={17} />Concludi
            </Button>
          </div>
        </div>
      </Card>
      <div className="grid gap-5">
        <Card><p className="eyebrow">Oggi</p><p className="display mt-4 text-6xl">{data?.focusStats.todayMinutes || 0}<span className="text-xl"> min</span></p></Card>
        <Card><p className="eyebrow">Questa settimana</p><p className="display mt-4 text-6xl">{data?.focusStats.weekMinutes || 0}<span className="text-xl"> min</span></p></Card>
        <Card><p className="eyebrow">Sessioni concluse</p><p className="display mt-4 text-6xl">{data?.focusStats.completedSessions || 0}</p></Card>
      </div>
    </div>
  </>;
}
