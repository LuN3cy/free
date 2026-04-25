import { execSync } from 'child_process';
import * as cheerio from 'cheerio';
import db from '../db/index.js';

interface ParsedRecord {
  period: string;
  frontZone: string;
  backZone: string;
  drawDate: string;
}

const LOTTERY_HTML_URL = 'https://datachart.500.com/dlt/history/newinc/history.php?start=00000&end=99999';

export const syncLotteryData = async (): Promise<{ syncedCount: number; message: string }> => {
  let syncedCount = 0;

  try {
    console.log('Fetching lottery HTML data via curl...');
    const html = execSync(`curl -s "${LOTTERY_HTML_URL}"`, { maxBuffer: 10 * 1024 * 1024 }).toString();
    const $ = cheerio.load(html);
    const records: ParsedRecord[] = [];

    $('#tablelist tr.t_tr1').each((index, element) => {
      const tds = $(element).find('td');
      if (tds.length >= 14) {
        const period = $(tds[0]).text().trim();
        const f1 = $(tds[1]).text().trim();
        const f2 = $(tds[2]).text().trim();
        const f3 = $(tds[3]).text().trim();
        const f4 = $(tds[4]).text().trim();
        const f5 = $(tds[5]).text().trim();
        const b1 = $(tds[6]).text().trim();
        const b2 = $(tds[7]).text().trim();
        const drawDate = $(tds[14]).text().trim();

        if (period && f1 && f5 && b2 && drawDate) {
          records.push({
            period,
            frontZone: `${f1},${f2},${f3},${f4},${f5}`,
            backZone: `${b1},${b2}`,
            drawDate
          });
        }
      }
    });

    if (records.length === 0) {
      throw new Error('No records found in HTML. Layout might have changed.');
    }

    console.log(`Parsed ${records.length} records. Inserting into database...`);

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO lottery_records (period, front_zone, back_zone, draw_date)
      VALUES (?, ?, ?, ?)
    `);

    const insertMany = db.transaction((recs: ParsedRecord[]) => {
      let inserted = 0;
      for (const rec of recs) {
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
    console.error('Error syncing lottery data:', error.message);
    throw new Error('Failed to sync lottery data');
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
