import { deleteAccount } from '@/app/actions/profile';
import { Button, Header, LinkButton } from '@/components/ui';

export default function DeleteAccount() {
  return (
    <main>
      <Header title="Delete your account?" back="/settings" />
      <div className="space-y-4 px-5 pt-2">
        <p className="text-muted">Your name, papers and chats are removed. Reports you made stay with our team. [Retention wording to be confirmed]</p>
        <form action={deleteAccount}><Button variant="danger" className="w-full">Delete my account</Button></form>
        <LinkButton href="/settings" variant="outline" className="w-full">Keep my account</LinkButton>
      </div>
    </main>
  );
}
