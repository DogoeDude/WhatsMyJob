import { indeedProvider } from '../lib/jobs/providers/indeed';
import { jobstreetProvider } from '../lib/jobs/providers/jobstreet';
import { linkedinProvider } from '../lib/jobs/providers/linkedin';

async function testProvider(name: string, provider: { isConfigured: () => boolean; fetchJobs: () => Promise<unknown[]> }) {
  console.log(`\n=== ${name} ===`);
  if (!provider.isConfigured()) {
    console.log('skipped — not configured');
    return;
  }
  try {
    const jobs = await provider.fetchJobs();
    console.log('jobs:', jobs.length);
    if (jobs[0]) {
      const job = jobs[0] as {
        title: string;
        company: string;
        location: string;
        applyUrl?: string;
        description: string;
      };
      console.log('sample:', {
        title: job.title,
        company: job.company,
        location: job.location,
        applyUrl: job.applyUrl,
        description: job.description.slice(0, 80),
      });
    }
  } catch (err) {
    console.error('error:', err instanceof Error ? err.message : err);
  }
}

async function main() {
  await testProvider('LinkedIn', linkedinProvider);
  await testProvider('Jobstreet', jobstreetProvider);
  await testProvider('Indeed', indeedProvider);
}

main();
