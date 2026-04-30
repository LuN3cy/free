import * as cheerio from 'cheerio';
import db from '../db/index.js';

interface ParsedRecord {
  period: string;
  frontZone: string;
  backZone: string;
  drawDate: string;
}

const LOTTERY_HTML_URL = 'https://cp.ip138.com/daletou/';

export const syncLotteryData = async (): Promise<{ syncedCount: number; message: string }> => {
  let syncedCount = 0;

  try {
    console.log('Fetching lottery HTML data via fetch...');
    const response = await fetch(LOTTERY_HTML_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    if (!response.ok) {
      throw new Error(`Upstream fetch failed: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    const records: ParsedRecord[] = [];

    const pad2 = (n: string) => n.trim().padStart(2, '0');

    $('table').each((_tIdx, table) => {
      const tableText = $(table).text();
      if (!tableText.includes('期号') || !tableText.includes('时间') || !tableText.includes('开奖结果')) return;

      $(table).find('tr').each((_rIdx, tr) => {
        const tds = $(tr).find('td');
        if (tds.length !== 3) return;

        const periodRaw = $(tds[0]).text().trim();
        const mmdd = $(tds[1]).text().trim();
        const nums = $(tds[2]).text().trim().replace(/\s+/g, ' ');

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

    if (records.length === 0) {
      throw new Error('No records found in HTML. Layout might have changed.');
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
