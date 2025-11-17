import ChatRoom from '@/components/chat/ChatRoom';

export default function ChatPage({
  params,
}: {
  params: { roomId: string };
}) {
  // TODO: Get userId and userName from session/auth
  const userId = 'user-123';
  const userName = 'Current User';

  return (
    <div className="h-screen p-2 sm:p-3 md:p-4">
      <ChatRoom
        roomId={params.roomId}
        userId={userId}
        userName={userName}
        wsUrl="ws://localhost:3000/ws"
      />
    </div>
  );
}
