import axios from 'axios';
import * as cheerio from 'cheerio';
import db from '../db/index.js';

interface ParsedRecord {
  period: string;
  frontZone: string;
  backZone: string;
  drawDate: string;
}

const LOTTERY_HTML_URL = 'https://cp.ip138.com/daletou/';
const LOTTERY_FALLBACK_URL = 'https://kjh.518158.cn/open/dlt/list_100.html';
const LOTTERY_FALLBACK_ORIGIN = 'https://kjh.518158.cn';

const fetchHtml = async (url: string) => {
  try {
    const res = await axios.get(url, {
      timeout: 15000,
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      validateStatus: () => true
    });
    if (res.status >= 200 && res.status < 300 && typeof res.data === 'string') {
      return res.data;
    }
    throw new Error(`Upstream fetch failed: ${res.status}`);
  } catch (_axiosErr) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    if (!response.ok) {
      throw new Error(`Upstream fetch failed: ${response.status}`);
    }
    return await response.text();
  }
};

export const syncLotteryData = async (): Promise<{ syncedCount: number; message: string }> => {
  let syncedCount = 0;

  try {
    const records: ParsedRecord[] = [];
    const pad2 = (n: string) => n.trim().padStart(2, '0');

    let primaryError: string | null = null;
    try {
      const ip138Html = await fetchHtml(LOTTERY_HTML_URL);
      const $ip138 = cheerio.load(ip138Html);

      $ip138('table').each((_tIdx, table) => {
        const tableText = $ip138(table).text();
        if (!tableText.includes('期号') || !tableText.includes('时间') || !tableText.includes('开奖结果')) return;

        $ip138(table).find('tr').each((_rIdx, tr) => {
          const tds = $ip138(tr).find('td');
          if (tds.length !== 3) return;

          const periodRaw = $ip138(tds[0]).text().trim();
          const mmdd = $ip138(tds[1]).text().trim();
          const nums = $ip138(tds[2]).text().trim().replace(/\s+/g, ' ');

          if (!periodRaw || !mmdd || !nums) return;

          const period = periodRaw.length >= 7 ? periodRaw.slice(2) : periodRaw;
          const year = periodRaw.length >= 4 ? periodRaw.slice(0, 4) : `20${period.slice(0, 2)}`;
          const [mm, dd] = mmdd.split('-');
          if (!year || !mm || !dd) return;

          const parts = nums.split(' ').filter(Boolean);
          if (parts.length < 7) return;

          const front = parts.slice(0, 5).map(pad2);
          const back = parts.slice(5, 7).map(pad2);
          const drawDate = `${year}-${pad2(mm)}-${pad2(dd)}`;

          records.push({
            period,
            frontZone: front.join(','),
            backZone: back.join(','),
            drawDate
          });
        });
      });
    } catch (e: any) {
      primaryError = e?.message ? String(e.message) : 'primary source failed';
    }

    if (records.length === 0) {
      const fallbackHtml = await fetchHtml(LOTTERY_FALLBACK_URL);
      const $fallback = cheerio.load(fallbackHtml);
      const items: Array<{ issue: string; numbers: string; href: string }> = [];

      $fallback('tr').each((_idx, tr) => {
        const a = $fallback(tr).find('a[href^="/open/dlt/"]');
        if (!a.length) return;
        const href = a.attr('href') || '';
        const issue = href.match(/(\d{7})\.html/)?.[1];
        if (!issue) return;
        const tds = $fallback(tr).find('td').map((_, td) => $fallback(td).text().trim().replace(/\s+/g, ' ')).get();
        const numbers = tds[4];
        if (!numbers || !numbers.includes('+')) return;
        items.push({ issue, numbers, href });
      });

      for (const item of items.slice(0, 50)) {
        const detailHtml = await fetchHtml(`${LOTTERY_FALLBACK_ORIGIN}${item.href}`);
        const date = detailHtml.match(/开奖时间：\s*\*{0,2}(\d{4}-\d{2}-\d{2})/)?.[1] || detailHtml.match(/开奖时间：\s*(\d{4}-\d{2}-\d{2})/)?.[1];
        if (!date) continue;

        const [frontStr, backStr] = item.numbers.split('+');
        const front = frontStr.trim().split(/\s+/).filter(Boolean).slice(0, 5).map(pad2);
        const back = backStr.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(pad2);
        if (front.length !== 5 || back.length !== 2) continue;

        records.push({
          period: item.issue.slice(2),
          frontZone: front.join(','),
          backZone: back.join(','),
          drawDate: date
        });
      }
    }

    if (records.length === 0) {
      throw new Error(primaryError ? `No records found. Primary error: ${primaryError}` : 'No records found in HTML. Layout might have changed.');
    }

    console.log(`Parsed ${records.length} records. Inserting into database...`);

    const deleteLegacyStmt = db.prepare(`
      DELETE FROM lottery_records WHERE period = ?
    `);
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO lottery_records (period, front_zone, back_zone, draw_date)
      VALUES (?, ?, ?, ?)
    `);

    const insertMany = db.transaction((recs: ParsedRecord[]) => {
      let inserted = 0;
      for (const rec of recs) {
        const legacyPeriod = rec.period.length === 5 ? `20${rec.period}` : null;
        if (legacyPeriod) {
          deleteLegacyStmt.run(legacyPeriod);
        }
        const result = insertStmt.run(rec.period, rec.frontZone, rec.backZone, rec.drawDate);
        if (result.changes > 0) {
          inserted++;
        }
      }
      return inserted;
    });

    syncedCount = insertMany(records);

    return { syncedCount, message: 'Sync successful' };
  } catch (error: any) {
    const msg = error?.message ? String(error.message) : 'Unknown error';
    console.error('Error syncing lottery data:', msg);
    throw new Error(`Failed to sync lottery data: ${msg}`);
  }
};

// 获取统计数据
export const getLotteryStats = () => {
  const records = db.prepare('SELECT front_zone, back_zone FROM lottery_records').all() as { front_zone: string, back_zone: string }[];
  
  const frontCounts: Record<string, number> = {};
  const backCounts: Record<string, number> = {};

  records.forEach(record => {
    record.front_zone.split(',').forEach(num => {
      frontCounts[num] = (frontCounts[num] || 0) + 1;
    });
    record.back_zone.split(',').forEach(num => {
      backCounts[num] = (backCounts[num] || 0) + 1;
    });
  });

  const formatStats = (counts: Record<string, number>) => {
    return Object.entries(counts)
      .map(([number, count]) => ({ number: parseInt(number, 10), count }))
      .sort((a, b) => b.count - a.count);
  };

  return {
    frontHot: formatStats(frontCounts),
    backHot: formatStats(backCounts),
    totalRecords: records.length
  };
};

// 获取最新开奖记录
export const getLatestRecords = (limit = 10) => {
  return db.prepare('SELECT * FROM lottery_records ORDER BY period DESC LIMIT ?').all(limit);
};

// 预热/全量同步数据 (如果数据库为空，可以一次性拉取)
export const initialSyncIfEmpty = async () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM lottery_records').get() as { count: number };
  if (count.count === 0) {
    console.log('Database is empty, starting initial sync...');
    await syncLotteryData();
  }
};
