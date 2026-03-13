export async function onRequest(context) {
  const { request, env } = context;
  try {
    const worker = await import("../src/worker/index.js"); 
    return await worker.default.fetch(request, env);
  } catch (e) {
    return new Response("Error interno: " + e.message, { status: 500 });
  }
}
