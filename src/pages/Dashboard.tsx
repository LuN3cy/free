import { useEffect, useState } from 'react';
import { useLotteryStore } from '../store/useLotteryStore';
import { RefreshCw, DatabaseZap, Clock, CalendarDays } from 'lucide-react';
import Layout from '../components/Layout';

export default function Dashboard() {
  const { records, stats, loading, syncing, error, fetchLatest, fetchStats, syncData } = useLotteryStore();
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    fetchLatest(5);
    fetchStats();
  }, [fetchLatest, fetchStats]);

  const handleSync = async () => {
    try {
      const res = await syncData();
      setSyncMessage(`同步成功！新增 ${res.syncedCount} 条数据`);
      fetchLatest(5);
      fetchStats();
      setTimeout(() => setSyncMessage(''), 5000);
    } catch (err: any) {
      setSyncMessage('同步失败: ' + err.message);
      setTimeout(() => setSyncMessage(''), 5000);
    }
  };

  const latestRecord = records.length > 0 ? records[0] : null;

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">大盘概览</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 md:mt-2 text-xs md:text-sm">查看最新开奖与系统数据状态</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            {syncMessage && (
              <span className={`text-xs md:text-sm font-medium text-center md:text-left ${syncMessage.includes('失败') ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                {syncMessage}
              </span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center justify-center gap-2 w-full md:w-auto px-5 py-2.5 rounded-xl font-bold bg-[#FF8A00] text-white hover:bg-[#E67A00] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-md"
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? '正在同步数据...' : '一键同步最新数据'}
            </button>
          </div>
        </header>

        {/* Latest Draw Panel */}
        <section className="glass-effect rounded-3xl p-8 shadow-sm dark:shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <h3 className="text-lg font-medium mb-8 flex items-center gap-2 text-slate-800 dark:text-slate-300">
            <Clock className="text-brand-orange" size={18} /> 
            最新一期开奖
            {latestRecord && (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange ml-3">
                第 {latestRecord.period} 期
              </span>
            )}
          </h3>

          {loading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="animate-pulse flex gap-4">
                {[...Array(5)].map((_, i) => <div key={`r-${i}`} className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800/50"></div>)}
                <div className="w-4"></div>
                {[...Array(2)].map((_, i) => <div key={`b-${i}`} className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800/50"></div>)}
              </div>
            </div>
          ) : latestRecord ? (
            <div className="flex flex-col items-center relative z-10">
              <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8">
                {latestRecord.front_zone.split(',').map((num, idx) => (
                  <div key={`f-${idx}`} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 dark:from-red-500 dark:to-red-700 flex items-center justify-center text-2xl md:text-3xl font-semibold shadow-md dark:shadow-[inset_0_0_20px_rgba(255,255,255,0.05),0_0_15px_rgba(239,68,68,0.3)] border border-red-300 dark:border-red-400/50 text-white">
                    {num}
                  </div>
                ))}
                <div className="w-2 md:w-4 flex items-center justify-center text-slate-400 dark:text-slate-600 font-light text-3xl mx-2">+</div>
                {latestRecord.back_zone.split(',').map((num, idx) => (
                  <div key={`b-${idx}`} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 flex items-center justify-center text-2xl md:text-3xl font-semibold shadow-md dark:shadow-[inset_0_0_20px_rgba(255,255,255,0.05),0_0_15px_rgba(59,130,246,0.3)] border border-blue-300 dark:border-blue-400/50 text-white">
                    {num}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-black/20 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/5 text-sm">
                <CalendarDays size={16} />
                <span>开奖日期：{latestRecord.draw_date}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500 relative z-10">
              <p>暂无数据，请点击右上角按钮同步最新数据</p>
            </div>
          )}
        </section>

        {/* Stats & History List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 glass-effect rounded-3xl p-6 shadow-sm dark:shadow-none">
            <h4 className="text-base font-medium mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-300">
              <DatabaseZap className="text-brand-orange" size={18} />
              数据库状态
            </h4>
            <div className="flex flex-col gap-4">
              <div className="bg-slate-50 dark:bg-black/20 rounded-2xl p-5 flex flex-col gap-2 border border-slate-200 dark:border-white/5">
                <span className="text-slate-500 dark:text-slate-400 text-sm">总收录期数</span>
                <span className="text-3xl font-semibold text-brand-orange tracking-tight">{stats?.totalRecords || 0}</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-500 mt-2 leading-relaxed bg-slate-50 dark:bg-black/10 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                <p className="mb-2">基于官方历史开奖记录（自2007年起）。</p>
                <p>前区号码：35选5</p>
                <p>后区号码：12选2</p>
                <p className="mt-4 text-xs opacity-70">全量数据用于为您提供更加精准的历史频率计算及随机选号参考。</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 glass-effect rounded-3xl p-4 md:p-6 overflow-hidden shadow-sm dark:shadow-none">
            <h4 className="text-base font-medium mb-6 text-slate-800 dark:text-slate-300 px-2">最近5期记录</h4>
            <div className="overflow-x-auto custom-scrollbar pb-2">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-500 text-xs md:text-sm">
                    <th className="pb-4 font-normal pl-2 whitespace-nowrap">期号</th>
                    <th className="pb-4 font-normal whitespace-nowrap">开奖日期</th>
                    <th className="pb-4 font-normal whitespace-nowrap">前区</th>
                    <th className="pb-4 font-normal whitespace-nowrap">后区</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {records.map((rec) => (
                    <tr key={rec.period} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="py-4 text-slate-700 dark:text-slate-300 pl-2 whitespace-nowrap">{rec.period}</td>
                      <td className="py-4 text-slate-500 whitespace-nowrap">{rec.draw_date}</td>
                      <td className="py-4 text-slate-700 dark:text-slate-300 font-mono tracking-widest whitespace-nowrap">{rec.front_zone.replace(/,/g, ' ')}</td>
                      <td className="py-4 text-blue-600 dark:text-blue-400 font-mono tracking-widest whitespace-nowrap">{rec.back_zone.replace(/,/g, ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
