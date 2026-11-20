import { Header, Card } from '@/components/ui';
import { FlightScene } from '@/components/FlightScene';

export default function MapPage() {
  return (
    <main>
      <Header title="Campus & Flight Map" back="/home" />
      <div className="space-y-4 px-5 pb-8">
        <FlightScene initialOrigin="gate" initialDest="chapel" />
        <Card className="space-y-1.5 text-label">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 rounded-full bg-[#2F5D50]" />
            <span className="font-semibold">Shared spot</span>
            <span className="text-muted">(Pickable for favourite spot & gists)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 rounded-full bg-[#C2762E]" />
            <span className="font-semibold">Faculty building</span>
            <span className="text-muted">(Pass-through only)</span>
          </div>
          <p className="pt-1 text-caption text-muted">
            Tap any two campus spots on the map, switch between 3D Aerial and 2D Top-down view, and watch Chief Coo deliver letters across campus!
          </p>
        </Card>
      </div>
    </main>
  );
}
