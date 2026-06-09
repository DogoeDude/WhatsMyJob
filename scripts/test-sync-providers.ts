import { syncJobProvider } from '@/lib/jobs/sync';

async function main() {
  const source = process.argv[2] ?? 'jobicy';
  const result = await syncJobProvider(source);
  console.log(source, result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
