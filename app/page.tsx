import { JobsHome } from '@/components/jobs-home';
import { loadHomeInitialData } from '@/lib/home-initial-data';

export default async function Home() {
  const initialData = await loadHomeInitialData();
  return <JobsHome initialData={initialData} />;
}
