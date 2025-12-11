export default async function (fastify) {
  fastify.get('/health', async () => ({ ok: true, ts: Date.now() }));
}
