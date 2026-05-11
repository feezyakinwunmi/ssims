// app/(dashboard)/student/documents/page.tsx
import dynamic from 'next/dynamic';

const StudentDocuments = dynamic(
  () => import('./client-page'),
  { ssr: false }
);

export default function Page() {
  return <StudentDocuments />;
}