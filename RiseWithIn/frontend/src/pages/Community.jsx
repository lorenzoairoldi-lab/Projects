import { gql, useMutation, useQuery } from '@apollo/client';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { Button, Card, Input, Modal, Notice } from '../components/ui.jsx';

const Q = gql`query { communityFeed { items { id authorId body topic likes likedByMe comments { id body authorId } } } }`;
const CREATE = gql`mutation($body:String!){createPost(body:$body,topic:"PROGRESSI"){id}}`;
const LIKE = gql`mutation($id:ID!){likePost(id:$id){id likes likedByMe}}`;
const COMMENT = gql`mutation($id:ID!,$body:String!){addComment(postId:$id,body:$body){id}}`;

export default function Community() {
  const [body, setBody] = useState('');
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const { data, error, refetch } = useQuery(Q);
  const [create, createState] = useMutation(CREATE);
  const [like] = useMutation(LIKE);
  const [addComment, commentState] = useMutation(COMMENT);
  const forbidden = error?.graphQLErrors?.some((item) => item.extensions?.code === 'FORBIDDEN');

  const publish = async () => {
    await create({ variables: { body } });
    setBody('');
    await refetch();
  };

  const commentOnPost = async (event) => {
    event.preventDefault();
    await addComment({ variables: { id: selected.id, body: comment } });
    setComment('');
    setSelected(null);
    await refetch();
  };

  return <>
    <PageHeader eyebrow="Crescere insieme" title="Community" copy="Condividi il percorso, chiedi sostegno e celebra progressi reali." />
    <div className="mx-auto max-w-3xl">
      {forbidden
        ? <Card className="border-fire/30 bg-fire/[.06] text-center"><h2 className="display text-2xl">Uno spazio Premium</h2><p className="mt-2 text-sm text-white/55">Passa al piano Premium per pubblicare e partecipare alla community.</p></Card>
        : <>
          {error && <Notice>La community non è raggiungibile in questo momento. Riprova tra poco.</Notice>}
          <Card>
            <textarea aria-label="Condividi un aggiornamento" maxLength={1000} className="min-h-24 w-full resize-none bg-transparent text-lg outline-none placeholder:text-white/25" placeholder="Cosa stai costruendo oggi?" value={body} onChange={(event) => setBody(event.target.value)} />
            <div className="flex justify-end border-t border-white/10 pt-4"><Button disabled={!body.trim() || createState.loading} onClick={publish}><Send size={16} />Pubblica</Button></div>
            {createState.error && <Notice className="mb-0 mt-4">Non riesco a pubblicare l’aggiornamento.</Notice>}
          </Card>
          <div className="mt-5 grid gap-4">
            {data?.communityFeed.items.map((post) => <Card key={post.id}>
              <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-fire/15 font-bold text-fire">RW</span><div><b>Membro RiseWithin</b><p className="text-xs text-white/35">#{post.topic.toLowerCase()}</p></div></div>
              <p className="my-5 leading-7 text-white/75">{post.body}</p>
              <div className="flex gap-3 border-t border-white/10 pt-4 text-sm text-white/55">
                <button aria-label={post.likedByMe ? 'Rimuovi Mi piace' : 'Metti Mi piace'} aria-pressed={post.likedByMe} onClick={async () => { await like({ variables: { id: post.id } }); await refetch(); }} className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/5"><Heart size={17} className={post.likedByMe ? 'fill-fire text-fire' : ''} />{post.likes}</button>
                <button onClick={() => setSelected(post)} className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/5"><MessageCircle size={17} />{post.comments.length}</button>
              </div>
            </Card>)}
          </div>
        </>}
    </div>
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Commenti">
      <div className="mb-5 grid gap-2">{selected?.comments.map((item) => <div key={item.id} className="rounded-xl bg-white/5 p-3 text-sm text-white/70">{item.body}</div>)}{selected && !selected.comments.length && <p className="text-sm text-white/45">Nessun commento. Puoi iniziare tu.</p>}</div>
      <form onSubmit={commentOnPost} className="grid gap-4"><Input label="Aggiungi un commento" value={comment} onChange={(event) => setComment(event.target.value)} required />{commentState.error && <Notice className="mb-0">Non riesco ad aggiungere il commento.</Notice>}<Button disabled={commentState.loading}>Commenta</Button></form>
    </Modal>
  </>;
}
