import { notFound } from 'next/navigation';
import { Header } from '@/components/ui';
import { ReportForm } from '@/components/ReportForm';

const uuid = /^[0-9a-f-]{36}$/i;

export default function ReportPage({ searchParams }: { searchParams: { paper?: string; chat?: string } }) {
  const paper = searchParams.paper && uuid.test(searchParams.paper) ? searchParams.paper : null;
  const chat = searchParams.chat && uuid.test(searchParams.chat) ? searchParams.chat : null;
  if (!paper && !chat) notFound();
  return (
    <main>
      <Header title="Report" back={chat ? `/chat/${chat}` : `/paper/${paper}`} />
      <ReportForm paperId={paper} chatId={chat} back={chat ? `/chat/${chat}` : `/paper/${paper}`} />
    </main>
  );
}
