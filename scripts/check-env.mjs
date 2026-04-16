/**
 * scripts/check-env.mjs
 *
 * Runs before `next build` (via the `prebuild` npm script).
 * Fails fast with a clear error if required environment variables are missing.
 * Never prints secret values — only reports which names are absent.
 */

const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('\n❌ Missing required environment variables:\n');
  for (const key of missing) {
    console.error(`   • ${key}`);
  }
  console.error(
    '\nSet these in Vercel: Project → Settings → Environment Variables' +
    '\nFor local dev: copy .env.example → .env.local and fill in real values.\n'
  );
  process.exit(1);
}

console.log('✅ Required environment variables are present.');
