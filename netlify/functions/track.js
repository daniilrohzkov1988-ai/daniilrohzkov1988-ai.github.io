// Считает просмотры страниц: общее число заходов и уникальных посетителей за день.
// Хранилище — Upstash Redis (бесплатный тариф, доступ по REST через обычный fetch).
const { redisIncr } = require('./lib/upstash');

const VISITOR_COOKIE = 'seen_today';

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

exports.handler = async (event) => {
  try {
    const key = todayKey();
    const cookieHeader = event.headers.cookie || event.headers.Cookie || '';
    const hasVisitorCookie = new RegExp(`(^|;\\s*)${VISITOR_COOKIE}=`).test(cookieHeader);

    await redisIncr(`views:${key}`);
    if (!hasVisitorCookie) await redisIncr(`uniques:${key}`);

    const headers = {};
    if (!hasVisitorCookie) {
      headers['Set-Cookie'] = `${VISITOR_COOKIE}=1; Path=/; Max-Age=86400; SameSite=Lax`;
    }
    return { statusCode: 204, headers };
  } catch (err) {
    // Учёт не должен ронять сайт при любых сбоях хранилища.
    return { statusCode: 204 };
  }
};
