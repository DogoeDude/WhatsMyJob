import { fetchLiveJobs } from '../lib/jobs/live-fetch';

async function main() {
  const { jobs, providerErrors } = await fetchLiveJobs(30);
  console.log('Jobs:', jobs.length);
  if (Object.keys(providerErrors).length) {
    console.log('Errors:', providerErrors);
  }
}

main().catch(console.error);
