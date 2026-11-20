import { Header, Card } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';

const RULES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'heart', title: 'Be kind', body: 'You are talking to a real student.' },
  { icon: 'lock', title: 'No numbers or links early on', body: 'This keeps everyone safe from scammers.' },
  { icon: 'shield', title: 'Never ask for money', body: 'Not even small small. Report it instead.' },
  { icon: 'info', title: 'Keep private things private', body: "Do not share anyone else's stuff." },
  { icon: 'flag', title: 'Report what feels off', body: 'One tap. We look at every report.' },
];
const KEEP = [
  ['Your school email', 'Used to check you are a student. Never shown to anyone.'],
  ['Your papers and chats', 'Kept so we can act on reports. Another person could screenshot, so share carefully.'],
  ['Your name', 'Real name or an alias, your choice. It shows on papers and chats.'],
  ['Your favourite spot', 'Shown only as a vibe clue. Never your location.'],
];

export default function Rules() {
  return (
    <main className="pb-10">
      <Header title="Our simple rules" back="/welcome" />
      <div className="space-y-3 px-5 pt-2">
        {RULES.map((r) => (
          <div key={r.title} className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-alt text-primary"><Icon name={r.icon} size={22} /></span>
            <div><p className="font-bold">{r.title}</p><p className="text-label text-muted">{r.body}</p></div>
          </div>
        ))}
        <h2 className="pt-4 text-title">What we keep, and who sees it</h2>
        {KEEP.map(([t, b]) => <Card key={t}><p className="font-bold">{t}</p><p className="text-label text-muted">{b}</p></Card>)}
        <p className="text-label text-muted">Staff see your content only when someone reports it. (Retention period to be confirmed.)</p>
      </div>
    </main>
  );
}
