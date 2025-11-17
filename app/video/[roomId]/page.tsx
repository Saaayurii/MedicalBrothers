import { redirect } from 'next/navigation';
import VideoConsultationRoom from '@/components/video/VideoConsultationRoom';
import { getCurrentUser } from '@/lib/unified-auth';

export default async function VideoPage({
  params,
}: {
  params: { roomId: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/patient/login');
  }

  return (
    <VideoConsultationRoom
      roomId={params.roomId}
      userId={user.id}
      userName={user.name}
      onLeave={() => {
        window.location.href = '/appointments';
      }}
    />
  );
}
