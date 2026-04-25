import { useEffect } from 'react';
import { useLotteryStore } from '../store/useLotteryStore';
import Layout from '../components/Layout';
import { TrendingUp, Flame, Snowflake } from 'lucide-react';

export default function History() {
  const { stats, loading, error, fetchStats } = useLotteryStore();

  useEffect(() => {
    if (!stats) {
      fetchStats();
    }
  }, [stats, fetchStats]);

  const maxFrontCount = stats?.frontHot[0]?.count || 1;
  const maxBackCount = stats?.backHot[0]?.count || 1;

  const getHotColdLabel = (count: number, max: number, min: number) => {
    if (count >= max * 0.9) return <span className="flex items-center gap-1 text-xs text-red-500 font-bold"><Flame size={14} />大热</span>;
    if (count <= min * 1.2) return <span className="flex items-center gap-1 text-xs text-blue-500 font-bold"><Snowflake size={14} />极冷</span>;
    return <span className="text-xs text-slate-500">温号</span>;
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 md:gap-8 h-full">
        <header className="shrink-0">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3 tracking-tight">
            <TrendingUp className="text-brand-orange" /> 历史走势
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 md:mt-2 text-xs md:text-sm">分析所有收录的开奖数据，提供前区与后区的冷热分布统计</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20 text-slate-400 dark:text-slate-500">数据加载中...</div>
        ) : error ? (
          <div className="flex justify-center py-20 text-red-500">{error}</div>
        ) : stats ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 flex-1 pb-10">
            {/* 前区统计 */}
            <div className="glass-effect rounded-3xl p-5 md:p-8 shadow-sm dark:shadow-none flex flex-col h-[60vh] md:h-[75vh] lg:h-auto">
              <h3 className="text-base md:text-lg font-medium mb-4 md:mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-300 shrink-0">
                <Flame className="text-brand-orange" size={18} /> 前区冷热频率 (35选5)
              </h3>
              
              <div className="flex flex-col gap-3 md:gap-4 overflow-y-auto pr-2 md:pr-4 custom-scrollbar flex-1 pb-4">
                {stats.frontHot.map((item, idx) => {
                  const percentage = (item.count / maxFrontCount) * 100;
                  const minCount = stats.frontHot[stats.frontHot.length - 1].count;
                  return (
                    <div key={`f-${item.number}`} className="flex items-center gap-4 group">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 flex items-center justify-center font-medium text-base shadow-sm dark:shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]">
                        {item.number.toString().padStart(2, '0')}
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">出现次数: <span className="text-slate-700 dark:text-slate-200 font-mono">{item.count}</span></span>
                          {getHotColdLabel(item.count, maxFrontCount, minCount)}
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-black/40 rounded-full overflow-hidden border border-slate-300 dark:border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-red-400 to-red-500 dark:from-red-500 dark:to-red-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 后区统计 */}
            <div className="glass-effect rounded-3xl p-5 md:p-8 shadow-sm dark:shadow-none flex flex-col h-[50vh] md:h-[60vh] lg:h-auto mt-4 lg:mt-0">
              <h3 className="text-base md:text-lg font-medium mb-4 md:mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-300 shrink-0">
                <Flame className="text-brand-orange" size={18} /> 后区冷热频率 (12选2)
              </h3>
              
              <div className="flex flex-col gap-3 md:gap-5 overflow-y-auto pr-2 md:pr-4 custom-scrollbar flex-1 pb-4">
                {stats.backHot.map((item, idx) => {
                  const percentage = (item.count / maxBackCount) * 100;
                  const minCount = stats.backHot[stats.backHot.length - 1].count;
                  return (
                    <div key={`b-${item.number}`} className="flex items-center gap-4 group">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-medium text-base shadow-sm dark:shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]">
                        {item.number.toString().padStart(2, '0')}
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">出现次数: <span className="text-slate-700 dark:text-slate-200 font-mono">{item.count}</span></span>
                          {getHotColdLabel(item.count, maxBackCount, minCount)}
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-black/40 rounded-full overflow-hidden border border-slate-300 dark:border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-20 text-slate-400 dark:text-slate-500">暂无统计数据</div>
        )}
      </div>
    </Layout>
  );
}
