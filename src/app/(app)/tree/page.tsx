import { Header } from '@/components/ui';
import { TreeScene } from '@/components/tree/TreeScene';

export const metadata = {
  title: 'The Message Tree · Gist Bird',
  description: 'A living environment where gists and letters find their rest.',
};

export default function MessageTreePage() {
  return (
    <main className="min-h-dvh flex flex-col">
      <Header title="The Message Tree" back="/home" />
      <div className="flex-1 px-4 pb-6 pt-1">
        <TreeScene />
      </div>
    </main>
  );
}
