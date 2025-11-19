import { redirect } from 'next/navigation';
import ChatRoom from '@/components/chat/ChatRoom';
import { getCurrentUser } from '@/lib/unified-auth';

export default async function ChatPage({
  params,
}: {
  params: { roomId: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/patient/login');
  }

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws';

  return (
    <div className="h-screen p-2 sm:p-3 md:p-4">
      <ChatRoom
        roomId={params.roomId}
        userId={user.id}
        userName={user.name}
        wsUrl={wsUrl}
      />
    </div>
  );
}
