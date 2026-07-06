// Тонкий клиент для Upstash Redis REST API (без npm-зависимостей — обычный fetch).
const BASE_URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisIncr(key) {
  const res = await fetch(`${BASE_URL}/incr/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`Upstash incr failed: ${res.status}`);
  const data = await res.json();
  return data.result;
}

async function redisPipeline(commands) {
  const res = await fetch(`${BASE_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`Upstash pipeline failed: ${res.status}`);
  return res.json();
}

module.exports = { redisIncr, redisPipeline };
