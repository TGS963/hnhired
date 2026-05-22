import { notFound } from 'next/navigation';
import { fetchPost } from '@/lib/posts';
import JobDetail from '@/components/JobDetail';
import JobModal from '@/components/JobModal';

type PageProps = { params: Promise<{ id: string }> };

export default async function InterceptedJobPage({ params }: PageProps) {
  const resolved = await params;
  const id = parseInt(resolved.id, 10);
  if (Number.isNaN(id)) notFound();

  const post = await fetchPost(id);
  if (!post) notFound();

  return (
    <JobModal>
      <JobDetail post={post} variant="modal" />
    </JobModal>
  );
}
