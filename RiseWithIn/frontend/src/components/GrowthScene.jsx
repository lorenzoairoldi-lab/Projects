import { Check, Flame, TimerReset } from 'lucide-react';

const steps = [
  { label: 'Scelto', value: '1 gesto', icon: Check },
  { label: 'Protetto', value: '25 min', icon: TimerReset },
  { label: 'Continuato', value: '12 giorni', icon: Flame }
];

export default function GrowthScene({ reducedMotion = false }) {
  return <div className="growth-signal" aria-label="Un percorso di crescita composto da azioni quotidiane">
    <div className="growth-signal__halo" />
    <div className="growth-signal__axis">
      <span className="growth-signal__progress" />
      {steps.map(({ label, value, icon: Icon }, index) => <div className={`growth-signal__step growth-signal__step--${index + 1}`} key={label}>
        <span className="growth-signal__node"><Icon size={18} /></span>
        <span className="growth-signal__card"><small>{label}</small><strong>{value}</strong></span>
      </div>)}
    </div>
    <div className={`growth-signal__pulse ${reducedMotion ? 'growth-signal__pulse--still' : ''}`}><span>OGGI</span><b>+1</b></div>
    <p className="growth-signal__caption">La trasformazione non gira in orbita.<br />Avanza, un gesto alla volta.</p>
  </div>;
}
