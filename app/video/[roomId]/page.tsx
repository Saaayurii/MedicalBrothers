import VideoConsultationRoom from '@/components/video/VideoConsultationRoom';

export default function VideoPage({
  params,
}: {
  params: { roomId: string };
}) {
  // TODO: Get userId and userName from session/auth
  const userId = 'user-123';
  const userName = 'Current User';

  return (
    <VideoConsultationRoom
      roomId={params.roomId}
      userId={userId}
      userName={userName}
      onLeave={() => {
        window.location.href = '/appointments';
      }}
    />
  );
}
