import { del, put } from '@vercel/blob';
import { createReadStream } from 'node:fs';

const [command, pathnameOrUrl, filePath, contentType] = process.argv.slice(2);

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
}

if (command === 'put') {
  if (!pathnameOrUrl || !filePath) {
    throw new Error('Usage: vercel-blob.mjs put <pathname> <filePath> [contentType]');
  }

  const blob = await put(pathnameOrUrl, createReadStream(filePath), {
    access: process.env.VERCEL_BLOB_ACCESS || 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: contentType || undefined,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  process.stdout.write(JSON.stringify(blob));
} else if (command === 'del') {
  if (!pathnameOrUrl) {
    throw new Error('Usage: vercel-blob.mjs del <urlOrPathname>');
  }

  await del(pathnameOrUrl, {
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  process.stdout.write(JSON.stringify({ deleted: true }));
} else {
  throw new Error(`Unknown command: ${command || '(empty)'}`);
}
