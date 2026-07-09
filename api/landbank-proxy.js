const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

function cleanOrigin(value) {
  return value ? value.replace(/\/+$/, '') : '';
}

function buildTargetUrl(request) {
  const origin = cleanOrigin(process.env.LANDBANK_APP_ORIGIN);

  if (!origin) {
    throw new Error('LANDBANK_APP_ORIGIN is not configured');
  }

  const incomingUrl = new URL(request.url, `https://${request.headers.host}`);
  const path = incomingUrl.searchParams.get('path') || '';
  incomingUrl.searchParams.delete('path');

  const targetUrl = new URL(`${origin}/${path.replace(/^\/+/, '')}`);
  incomingUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  return { origin, targetUrl };
}

function copyRequestHeaders(headers) {
  const copied = {};

  for (const [key, value] of Object.entries(headers)) {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      copied[key] = value;
    }
  }

  copied['x-forwarded-prefix'] = '/landbank';

  return copied;
}

function copyResponseHeaders(response, origin) {
  const copied = {};

  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();

    if (HOP_BY_HOP_HEADERS.has(lowerKey)) {
      return;
    }

    if (lowerKey === 'location') {
      copied[key] = value.replace(origin, '/landbank');
      return;
    }

    if (lowerKey === 'set-cookie') {
      copied[key] = value.replace(/;\s*Path=\//gi, '; Path=/landbank');
      return;
    }

    copied[key] = value;
  });

  return copied;
}

export default async function handler(request, response) {
  let origin;
  let targetUrl;

  try {
    ({ origin, targetUrl } = buildTargetUrl(request));
  } catch (error) {
    response.status(500).json({
      error: error.message,
      hint: 'Set LANDBANK_APP_ORIGIN in Vercel to the Laravel app origin, for example https://landbank.example.com',
    });
    return;
  }

  const method = request.method || 'GET';
  const hasBody = !['GET', 'HEAD'].includes(method);

  const upstream = await fetch(targetUrl, {
    method,
    headers: copyRequestHeaders(request.headers),
    body: hasBody ? request : undefined,
    redirect: 'manual',
    duplex: hasBody ? 'half' : undefined,
  });

  const body = Buffer.from(await upstream.arrayBuffer());
  const headers = copyResponseHeaders(upstream, origin);

  response.writeHead(upstream.status, headers);
  response.end(body);
}
