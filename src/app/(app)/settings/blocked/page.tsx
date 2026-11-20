import { getBlocks } from '@/lib/data';
import { unblockUser } from '@/app/actions/safety';
import { Avatar, Button, Card, Header } from '@/components/ui';

export default async function Blocked() {
  const list = await getBlocks();
  return (
    <main>
      <Header title="Blocked people" back="/settings" />
      <div className="space-y-3 px-5 pt-2">
        {list.length === 0 && <p className="text-muted">You have not blocked anyone.</p>}
        {list.map((b) => (
          <Card key={b.id} className="flex items-center gap-3 p-3.5">
            <Avatar name={b.name} scarf={b.scarf} avatar={b.avatar} /><p className="flex-1 font-bold">{b.name}</p>
            <form action={unblockUser.bind(null, b.id)}><Button variant="outline" className="min-h-[44px]">Unblock</Button></form>
          </Card>
        ))}
        <p className="text-label text-muted">Blocked people cannot see your papers or find you again.</p>
      </div>
    </main>
  );
}
