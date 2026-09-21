// Wrapper to ensure Next.js standalone runs on Port 8180 across Windows, Linux, and Docker
process.env.PORT = process.env.PORT || '8180';
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

console.log(`[AOS100 Production Server] Initializing standalone server on port ${process.env.PORT}...`);
await import('../.next/standalone/server.js');
