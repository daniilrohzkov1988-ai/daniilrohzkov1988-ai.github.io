const { redisPipeline } = require('./lib/upstash');
const { isValidSession } = require('./lib/auth');

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

function sumViews(days) {
  return days.reduce((acc, d) => acc + d.views, 0);
}

function sumUniques(days) {
  return days.reduce((acc, d) => acc + d.uniques, 0);
}

exports.handler = async (event) => {
  const secret = process.env.SESSION_SECRET;
  const cookieHeader = event.headers.cookie || event.headers.Cookie || '';
  if (!isValidSession(cookieHeader, secret)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const totalDays = 30;
  const today = new Date();
  const dates = [];
  for (let i = totalDays - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(dateKey(d));
  }

  const commands = dates.flatMap((date) => [
    ['GET', `views:${date}`],
    ['GET', `uniques:${date}`],
  ]);

  let results;
  try {
    results = await redisPipeline(commands);
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Не удалось получить статистику' }) };
  }

  const daily = dates.map((date, i) => ({
    date,
    views: Number(results[i * 2] && results[i * 2].result) || 0,
    uniques: Number(results[i * 2 + 1] && results[i * 2 + 1].result) || 0,
  }));

  const last7 = daily.slice(-7);
  const prev7 = daily.slice(-14, -7);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      daily,
      today: daily[daily.length - 1],
      thisWeek: { views: sumViews(last7), uniques: sumUniques(last7) },
      lastWeek: { views: sumViews(prev7), uniques: sumUniques(prev7) },
    }),
  };
};
