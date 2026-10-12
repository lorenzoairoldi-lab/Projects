import { gql, useLazyQuery, useQuery } from '@apollo/client';
import { ArrowUpRight, BookOpen, Lock, Play } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { Badge, Card, Modal, Notice } from '../components/ui.jsx';

const Q = gql`query { contents { items { id title slug summary type category durationMinutes premium } } }`;
const DETAIL = gql`query ContentDetail($slug:String!){content(slug:$slug){id title body type category durationMinutes premium}}`;
const filters = [
  ['Tutto', null], ['Abitudini', 'ABITUDINI'], ['Mindset', 'MINDSET'], ['Focus', 'FOCUS'], ['Routine', 'ROUTINE']
];

export default function Content() {
  const [category, setCategory] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { data, loading, error } = useQuery(Q);
  const [loadDetail, detail] = useLazyQuery(DETAIL, { fetchPolicy: 'network-only' });
  const items = (data?.contents.items || []).filter((item) => !category || item.category === category);

  const openContent = async (slug) => {
    setDetailOpen(true);
    await loadDetail({ variables: { slug } });
  };

  return <>
    <PageHeader eyebrow="Idee da portare nella vita" title="Esplora" copy="Guide brevi, strumenti concreti e prospettive per capire meglio come cambi." />
    {error && <Notice>Non riesco a caricare i contenuti. Riprova tra poco.</Notice>}
    <div className="mb-7 flex gap-2 overflow-auto pb-1" role="tablist" aria-label="Filtra contenuti">
      {filters.map(([label, value]) => <button
        key={label}
        role="tab"
        aria-selected={category === value}
        onClick={() => setCategory(value)}
        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${category === value ? 'bg-fire text-white' : 'border border-white/12 bg-white/[.04] text-white/65 hover:text-white'}`}
      >{label}</button>)}
    </div>
    {!loading && !error && !items.length && <Notice tone="success">Nessun contenuto disponibile in questa categoria.</Notice>}
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((content, index) => <button key={content.id} onClick={() => openContent(content.slug)} className={`text-left ${index === 0 ? 'md:col-span-2' : ''}`}>
        <Card className="group h-full overflow-hidden p-0 hover:border-fire/45">
          <div className={`grid h-44 place-items-center ${index % 2 ? 'bg-[#1c0b0d]' : 'bg-[#171719]'}`}>{content.type === 'VIDEO' ? <Play size={42} className="text-fire" /> : <BookOpen size={42} className="text-fire" />}</div>
          <div className="p-5">
            <div className="flex items-center justify-between"><Badge>{content.category}</Badge>{content.premium && <Lock size={15} className="text-fire" />}</div>
            <h2 className="display mt-5 text-3xl">{content.title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">{content.summary}</p>
            <div className="mt-5 flex justify-between border-t border-white/10 pt-4 text-xs font-bold uppercase tracking-wider text-white/40"><span>{content.durationMinutes} min</span><ArrowUpRight size={17} className="transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-fire" /></div>
          </div>
        </Card>
      </button>)}
    </div>
    <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={detail.data?.content?.title || 'Contenuto'}>
      {detail.loading && <p className="text-sm text-white/50">Caricamento…</p>}
      {detail.error && <Notice className="mb-0">{detail.error.graphQLErrors?.some((item) => item.extensions?.code === 'FORBIDDEN') ? 'Questo contenuto richiede un piano Pro o Premium.' : 'Non riesco ad aprire questo contenuto.'}</Notice>}
      {detail.data?.content && <article><Badge>{detail.data.content.category}</Badge><p className="mt-5 whitespace-pre-line leading-7 text-white/70">{detail.data.content.body}</p></article>}
    </Modal>
  </>;
}
