import { CampusMap } from '@/components/CampusMap';
import { Header, Card } from '@/components/ui';

export default function MapPage() {
  return (
    <main>
      <Header title="Campus" back="/home" />
      <div className="space-y-4 px-5">
        <CampusMap label="Campus map, not to scale" />
        <Card className="space-y-1 text-label">
          <p><span className="mr-2 inline-block h-3 w-3 rounded-full bg-primary align-middle" />Shared spot</p>
          <p><span className="mr-2 inline-block h-3 w-3 rounded-full border-2 border-dashed border-ink align-middle" />Faculty building · pass-through only</p>
          <p className="text-muted">Not to scale. Spots are for vibe clues, not live locations.</p>
        </Card>
      </div>
    </main>
  );
}
