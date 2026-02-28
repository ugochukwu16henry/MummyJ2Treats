/**
 * Test Railway S3 bucket connectivity.
 * Run from apps/backend: node scripts/test-s3.js
 * Loads .env from apps/backend or repo root.
 */
const path = require('path');
const fs = require('fs');

// Load .env from backend or repo root (no dotenv dependency)
function loadEnv() {
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '../../.env'),
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../../../.env'),
  ];
  let envPath = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      envPath = p;
      break;
    }
  }
  if (!envPath) return;
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const stripped = line.replace(/#.*$/, '').trim();
      const m = stripped.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) {
        const v = m[2].replace(/^["']|["']$/g, '').trim();
        if (v) process.env[m[1]] = v;
      }
    });
  } catch (_) {}
}
loadEnv();

const { S3Client, PutObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

async function main() {
  const endpoint = (process.env.S3_ENDPOINT || '').trim();
  const accessKey = (process.env.S3_ACCESS_KEY_ID || '').trim();
  const secretKey = (process.env.S3_SECRET_ACCESS_KEY || '').trim();
  const bucket = (process.env.S3_BUCKET || '').trim();
  const region = (process.env.S3_REGION || '').trim() || 'auto';

  console.log('S3 config:');
  console.log('  S3_ENDPOINT:', endpoint ? endpoint : '(missing)');
  console.log('  S3_BUCKET:', bucket || '(missing)');
  console.log('  S3_REGION:', region);
  console.log('  S3_ACCESS_KEY_ID:', accessKey ? `${accessKey.slice(0, 8)}...` : '(missing)');
  console.log('  S3_SECRET_ACCESS_KEY:', secretKey ? '***set***' : '(missing)');
  console.log('');

  if (!endpoint || !accessKey || !secretKey || !bucket) {
    console.error('Missing required S3 env vars. Set S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET.');
    process.exit(1);
  }

  const client = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: true,
  });

  try {
    console.log('1. Checking bucket access (HeadBucket)...');
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log('   OK – bucket exists and is accessible.\n');

    console.log('2. Uploading test file...');
    const testKey = `_test/connectivity-check-${Date.now()}.txt`;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: Buffer.from('Railway bucket connectivity test from MummyJ2Treats backend.'),
        ContentType: 'text/plain',
      })
    );
    console.log('   OK – test file uploaded to', testKey, '\n');

    console.log('Railway bucket is connected and ready to receive files.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    if (err.name) console.error('  name:', err.name);
    if (err.$metadata?.httpStatusCode) console.error('  httpStatusCode:', err.$metadata.httpStatusCode);
    process.exit(1);
  }
}

main();
