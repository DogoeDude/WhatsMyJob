import { getActiveProviders, jobProviders } from '../lib/jobs/providers';

async function main() {
  const active = getActiveProviders();
  console.log(`Configured providers: ${active.map((p) => p.id).join(', ') || '(none with keys)'}\n`);

  for (const provider of jobProviders) {
    const configured = provider.isConfigured();
    process.stdout.write(`${provider.name} (${provider.id})... `);

    if (!configured) {
      console.log('skipped — no API key');
      continue;
    }

    try {
      const jobs = await provider.fetchJobs();
      console.log(`OK — ${jobs.length} jobs`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`FAILED — ${msg}`);
    }
  }
}

main().catch(console.error);
