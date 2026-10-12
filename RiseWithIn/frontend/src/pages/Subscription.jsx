import { gql, useMutation, useQuery } from '@apollo/client';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { Badge, Button, Card, Notice } from '../components/ui.jsx';
import { refreshSession } from '../graphql/client.js';

const PLANS = gql`query { plans { id name priceCents features } mySubscription { plan status } }`;
const CHECKOUT = gql`mutation($plan:Plan!,$success:String!,$cancel:String!){createCheckoutSession(plan:$plan,successUrl:$success,cancelUrl:$cancel){url}}`;
const PORTAL = gql`mutation($returnUrl:String!){createBillingPortal(returnUrl:$returnUrl){url}}`;

const goToStripeCheckout = (value) => {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Stripe ha restituito un URL non valido');
  window.location.assign(url.toString());
};

const goToStripePortal = (value) => {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'billing.stripe.com') throw new Error('Stripe ha restituito un URL non valido');
  window.location.assign(url.toString());
};

export default function Subscription() {
  const success = new URLSearchParams(window.location.search).get('success') === '1';
  const [message, setMessage] = useState(success ? 'Pagamento ricevuto. Sto attivando il piano…' : '');
  const refreshed = useRef(false);
  const { data, error, startPolling, stopPolling } = useQuery(PLANS);
  const [checkout, checkoutState] = useMutation(CHECKOUT);
  const [openPortal, portalState] = useMutation(PORTAL);

  useEffect(() => {
    if (!success) return undefined;
    startPolling(1200);
    return () => stopPolling();
  }, [success, startPolling, stopPolling]);

  useEffect(() => {
    if (!success || refreshed.current || data?.mySubscription.status !== 'ACTIVE') return;
    refreshed.current = true;
    stopPolling();
    refreshSession().then(() => {
      setMessage(`Piano ${data.mySubscription.plan} attivato.`);
      window.history.replaceState({}, '', '/subscription');
    }).catch(() => setMessage('Piano attivato. Accedi di nuovo per aggiornare i permessi.'));
  }, [success, data, stopPolling]);

  const choose = async (plan) => {
    if (plan === 'FREE') return;
    const origin = window.location.origin;
    const response = await checkout({ variables: { plan, success: `${origin}/subscription?success=1`, cancel: `${origin}/subscription` } });
    goToStripeCheckout(response.data.createCheckoutSession.url);
  };

  const manage = async () => {
    const response = await openPortal({ variables: { returnUrl: `${window.location.origin}/subscription` } });
    goToStripePortal(response.data.createBillingPortal.url);
  };

  return <>
    <PageHeader eyebrow="Scegli quanto andare in profondità" title="Il tuo piano" copy="Parti gratis. Passa a un piano superiore quando gli strumenti extra diventano utili." />
    {error && <Notice>Non riesco a caricare i piani.</Notice>}
    {checkoutState.error && <Notice>Non riesco ad avviare il pagamento. Verifica la configurazione Stripe.</Notice>}
    {portalState.error && <Notice>Non riesco ad aprire la gestione dell’abbonamento.</Notice>}
    {message && <Notice tone={data?.mySubscription.status === 'ACTIVE' ? 'success' : 'error'}>{message}</Notice>}
    <div className="grid gap-5 lg:grid-cols-3">
      {data?.plans.map((plan) => <Card key={plan.id} className={plan.id === 'PRO' ? 'border-fire/55 bg-[#170b0c] shadow-2xl' : ''}>
        <div className="flex items-center justify-between"><h2 className="display text-4xl">{plan.name}</h2>{data.mySubscription.plan === plan.id && <Badge tone="coral">Attuale</Badge>}</div>
        <p className="display mt-7 text-5xl">€{(plan.priceCents / 100).toFixed(2)}<span className="text-base opacity-45">/mese</span></p>
        <ul className="my-8 space-y-4">{plan.features.map((feature) => <li className="flex gap-3 text-sm text-white/70" key={feature}><Check size={17} className="text-fire" />{feature}</li>)}</ul>
        <Button disabled={checkoutState.loading || data.mySubscription.plan === plan.id || plan.id === 'FREE'} onClick={() => choose(plan.id)} className="w-full">
          {data.mySubscription.plan === plan.id ? 'Piano attuale' : plan.id === 'FREE' ? 'Incluso' : `Scegli ${plan.name}`}
        </Button>
      </Card>)}
    </div>
    {data?.mySubscription.plan !== 'FREE' && <div className="mt-6 flex justify-end"><Button variant="secondary" disabled={portalState.loading} onClick={manage}>Gestisci o annulla l’abbonamento</Button></div>}
  </>;
}
