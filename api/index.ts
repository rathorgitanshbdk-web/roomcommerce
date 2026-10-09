import app from '../server';

export default function handler(req: any, res: any) {
  // If request URL was rewritten by Vercel, restore path from headers if needed
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/products')) {
    const matchedPath = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'];
    if (typeof matchedPath === 'string' && matchedPath.startsWith('/api')) {
      req.url = matchedPath;
    }
  }
  return app(req, res);
}
