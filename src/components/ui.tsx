import Link from 'next/link';
import { Icon, type IconName } from './Icon';
import { SCARF_HEX, type Scarf } from '@/lib/types';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'disabled';
const VARIANT: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary active:brightness-90',
  outline: 'border-2 border-ink text-ink bg-transparent active:bg-surface-alt',
  ghost: 'text-primary bg-transparent active:bg-surface-alt',
  danger: 'bg-danger text-on-primary active:brightness-90',
  disabled: 'bg-line text-muted cursor-not-allowed',
};
const base = 'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-btn px-5 text-body font-bold transition';

export function Button({ variant = 'primary', icon, className = '', children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: IconName }) {
  const v = rest.disabled ? 'disabled' : variant;
  return <button {...rest} className={`${base} ${VARIANT[v]} ${className}`}>{icon && <Icon name={icon} size={20} />}{children}</button>;
}

export function LinkButton({ href, variant = 'primary', icon, className = '', children }: { href: string; variant?: Variant; icon?: IconName; className?: string; children: React.ReactNode }) {
  return <Link href={href} className={`${base} ${VARIANT[variant]} ${className}`}>{icon && <Icon name={icon} size={20} />}{children}</Link>;
}

export function Chip({ children, selected = false, onClick, disabled }: { children: React.ReactNode; selected?: boolean; onClick?: () => void; disabled?: boolean }) {
  const cls = `inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3.5 text-label font-semibold ${selected ? 'bg-primary text-on-primary' : 'border-[1.5px] border-line bg-surface text-ink'}`;
  if (!onClick) return <span className={cls}>{selected && <Icon name="check" size={16} />}{children}</span>;
  return <button type="button" aria-pressed={selected} disabled={disabled} onClick={onClick} className={`${cls} disabled:opacity-50`}>{selected && <Icon name="check" size={16} />}{children}</button>;
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-card border-[1.5px] border-line bg-surface p-4 ${className}`}>{children}</div>;
}

const NOTICE: Record<string, string> = { info: 'bg-sky', ok: 'bg-surface-alt', gentle: 'bg-lemon', err: 'bg-[#FBE3E0]' };
export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'ok' | 'gentle' | 'err'; title: string; children?: React.ReactNode }) {
  return (
    <div role={tone === 'err' ? 'alert' : 'status'} className={`flex gap-3 rounded-card p-3.5 ${NOTICE[tone]}`}>
      <Icon name={tone === 'ok' ? 'check' : tone === 'err' ? 'flag' : 'info'} size={22} className={`mt-0.5 shrink-0 ${tone === 'err' ? 'text-danger' : ''}`} />
      <div><p className="font-bold">{title}</p>{children && <p className="text-label text-muted">{children}</p>}</div>
    </div>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-label font-semibold text-muted">{label}</span>
      {children}
      {(error || hint) && <span className={`mt-1.5 block text-label ${error ? 'text-danger' : 'text-muted'}`}>{error ?? hint}</span>}
    </label>
  );
}
export const inputCls = (error?: boolean) =>
  `w-full rounded-input border-[1.5px] bg-surface px-4 text-body text-ink placeholder:text-muted focus:border-primary focus:outline-none ${error ? 'border-danger border-2' : 'border-line'}`;

export function Avatar({ name, scarf, size = 44 }: { name: string; scarf: Scarf; size?: number }) {
  const bg = SCARF_HEX[scarf];
  const dark = scarf === 'lemon';
  return (
    <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold" style={{ width: size, height: size, background: bg, color: dark ? '#0E2A1B' : '#fff', fontSize: size * 0.42 }}>
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

const TONE: Record<string, string> = { flying: 'bg-sky text-ink', landed: 'bg-surface-alt text-ink', read: 'bg-lemon text-ink', hi: 'bg-primary text-on-primary', back: 'bg-surface-alt text-ink' };
export function StatusPill({ tone, children }: { tone: keyof typeof TONE; children: React.ReactNode }) {
  return <span className={`inline-flex rounded-full px-3 py-1.5 text-label font-bold ${TONE[tone]}`}>{children}</span>;
}

export function Header({ title, back, right }: { title?: string; back?: string; right?: React.ReactNode }) {
  return (
    <header className="flex items-center gap-3 px-5 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))]">
      {back && <Link href={back} aria-label="Back" className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-line bg-surface"><Icon name="back" size={22} /></Link>}
      {title && <h1 className="flex-1 text-title">{title}</h1>}
      {!title && <span className="flex-1" />}
      {right}
    </header>
  );
}

export function Empty({ pose = 'curious', title, children, action }: { pose?: 'wave' | 'cool' | 'curious'; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-8 py-12 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/mascot/${pose}.svg`} alt="" width={170} height={153} />
      <h2 className="text-title">{title}</h2>
      {children && <p className="text-muted">{children}</p>}
      {action && <div className="mt-2 w-full">{action}</div>}
    </div>
  );
}

export const timeAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};
