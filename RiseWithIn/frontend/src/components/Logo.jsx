const Mark = () => <svg className="h-10 w-9 shrink-0" viewBox="0 0 64 72" aria-hidden="true">
  <defs>
    <mask id="rw-logo-cutout">
      <rect width="64" height="72" fill="white" />
      <path d="M18.5 38 25.5 57 32 46 38.5 57 45.5 38" fill="none" stroke="black" strokeWidth="7" strokeLinecap="square" strokeLinejoin="miter" />
    </mask>
  </defs>
  <path className="fill-fire" mask="url(#rw-logo-cutout)" d="M34.2 2.8c-2.1 10.4 3.9 16.7 10 22.5 7 6.7 13.4 13 13.4 23.3 0 12.3-10.4 21-25.6 21-15.3 0-25.6-8.7-25.6-21 0-9.2 5.4-15.4 10.3-21 3.7-4.2 6.7-8.4 6.5-14.5 7.3 6.3 8.1 13.2 7.5 18.6 5.4-6.4-5-16.6 3.5-28.9Z" />
</svg>;

export default function Logo({ light = false, markOnly = false }) {
  return <span className={`inline-flex items-center gap-2.5 ${light ? 'text-white' : 'text-ink'}`} aria-label="RiseWithin">
    <Mark />
    {!markOnly && <span className="font-impact text-[17px] font-extrabold tracking-[-.045em]">RiseWithin</span>}
  </span>;
}
