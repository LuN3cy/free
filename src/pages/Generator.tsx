import { useState, useEffect } from 'react';
import { useLotteryStore } from '../store/useLotteryStore';
import Layout from '../components/Layout';
import { Settings2, Zap, Copy, Save, CheckCircle2, Dices, Lightbulb } from 'lucide-react';

interface GeneratedResult {
  front: string[];
  back: string[];
  reason: string;
}

export default function Generator() {
  const { stats, fetchStats } = useLotteryStore();
  const [mode, setMode] = useState<'random' | 'predict'>('random');
  const [sets, setSets] = useState<number>(5);
  const [generated, setGenerated] = useState<GeneratedResult[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    if (!stats) {
      fetchStats();
    }
  }, [stats, fetchStats]);

  // 生成纯随机号码
  const generateRandom = (max: number, count: number): string[] => {
    const nums = new Set<number>();
    while (nums.size < count) {
      nums.add(Math.floor(Math.random() * max) + 1);
    }
    return Array.from(nums).sort((a, b) => a - b).map(n => n.toString().padStart(2, '0'));
  };

  // 改进的混合频率预测算法：热号与冷号结合
  const generatePredicted = (
    hotData: { number: number, count: number }[], 
    count: number, 
    type: 'front' | 'back'
  ): { nums: string[], reasonData: { hot: number, cold: number, avg: number } } => {
    if (!hotData || hotData.length === 0) {
      return { nums: generateRandom(type === 'front' ? 35 : 12, count), reasonData: { hot: 0, cold: 0, avg: 0 } };
    }
    
    // 排序后的热度数据：hotData 已经是按 count 降序排列的
    const hotNumbers = hotData.slice(0, Math.floor(hotData.length / 3)); // 前 33% 算热号
    const coldNumbers = hotData.slice(-Math.floor(hotData.length / 3)); // 后 33% 算冷号
    const avgNumbers = hotData.slice(Math.floor(hotData.length / 3), -Math.floor(hotData.length / 3)); // 中间算温号

    const selected = new Set<number>();
    let hotCount = 0, coldCount = 0, avgCount = 0;

    // 策略：前区(5个)尽量包含 2热 1冷 2温；后区(2个)尽量包含 1热 1冷或1温
    const pickRandomFrom = (arr: { number: number, count: number }[]) => {
      if (arr.length === 0) return null;
      return arr[Math.floor(Math.random() * arr.length)].number;
    };

    while (selected.size < count) {
      let num = null;
      if (type === 'front') {
        if (hotCount < 2) { num = pickRandomFrom(hotNumbers); hotCount++; }
        else if (coldCount < 1) { num = pickRandomFrom(coldNumbers); coldCount++; }
        else { num = pickRandomFrom(avgNumbers); avgCount++; }
      } else {
        if (hotCount < 1) { num = pickRandomFrom(hotNumbers); hotCount++; }
        else { num = pickRandomFrom([...coldNumbers, ...avgNumbers]); coldCount++; }
      }

      if (num && !selected.has(num)) {
        selected.add(num);
      } else {
        // 如果重复了，回退计数
        if (type === 'front') {
          if (hotCount > 0 && num && hotNumbers.find(x => x.number === num)) hotCount--;
          else if (coldCount > 0 && num && coldNumbers.find(x => x.number === num)) coldCount--;
          else avgCount--;
        } else {
          if (hotCount > 0 && num && hotNumbers.find(x => x.number === num)) hotCount--;
          else coldCount--;
        }
      }
    }

    return {
      nums: Array.from(selected).sort((a, b) => a - b).map(n => n.toString().padStart(2, '0')),
      reasonData: { hot: hotCount, cold: coldCount, avg: avgCount }
    };
  };

  const handleGenerate = () => {
    const results: GeneratedResult[] = [];
    for (let i = 0; i < sets; i++) {
      if (mode === 'random') {
        const front = generateRandom(35, 5);
        const back = generateRandom(12, 2);
        results.push({
          front,
          back,
          reason: '完全随机生成，模拟真实摇奖机的绝对随机性，不受任何历史数据影响。'
        });
      } else {
        const frontRes = generatePredicted(stats?.frontHot || [], 5, 'front');
        const backRes = generatePredicted(stats?.backHot || [], 2, 'back');
        
        let reason = `前区包含 ${frontRes.reasonData.hot}个热号, ${frontRes.reasonData.cold}个冷号, ${frontRes.reasonData.avg}个温号；后区包含 ${backRes.reasonData.hot}个热号, ${backRes.reasonData.cold}个冷/温号。`;
        reason += ' 采用冷热均衡策略，防范大热必死的规律，同时兼顾了历史高频数字。';
        
        results.push({
          front: frontRes.nums,
          back: backRes.nums,
          reason
        });
      }
    }
    setGenerated(results);
  };

  const copyToClipboard = (front: string[], back: string[], index: number) => {
    const text = `大乐透推荐：前区 [${front.join(' ')}] 后区 [${back.join(' ')}]`;
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <header>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3 tracking-tight">
            <Zap className="text-brand-orange" /> 号码生成器
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">支持完全随机和基于历史大数据的加权预测生成</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-4 glass-effect rounded-3xl p-8 h-fit shadow-sm dark:shadow-none">
            <h3 className="text-lg font-medium mb-8 flex items-center gap-2 text-slate-800 dark:text-slate-300">
              <Settings2 className="text-brand-orange" size={18} />
              生成配置
            </h3>

            <div className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">生成模式</label>
                <div className="flex bg-slate-100 dark:bg-black/20 p-1 rounded-xl border border-slate-200 dark:border-white/5 relative">
                  <div 
                    className={`absolute inset-y-1 w-[calc(50%-4px)] bg-white dark:bg-brand-orange/20 border border-slate-200 dark:border-brand-orange/30 rounded-lg transition-transform duration-300 shadow-sm dark:shadow-none ${mode === 'predict' ? 'translate-x-full' : 'translate-x-0'}`}
                  ></div>
                  <button
                    onClick={() => setMode('random')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all relative z-10 ${mode === 'random' ? 'text-slate-900 dark:text-brand-orange' : 'text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'}`}
                  >
                    🎲 完全随机
                  </button>
                  <button
                    onClick={() => setMode('predict')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all relative z-10 ${mode === 'predict' ? 'text-slate-900 dark:text-brand-orange' : 'text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'}`}
                  >
                    📈 频率预测
                  </button>
                </div>
                
                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-brand-orange/5 border border-slate-200 dark:border-brand-orange/10">
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-brand-orange/70">
                    {mode === 'random' 
                      ? '每个号码出现概率均等，模拟真实物理摇奖机的绝对随机性。' 
                      : '采用大数定律与加权随机算法：系统分析了所有历史开奖数据，计算出每个号码出现的相对频率作为权重因子。高频热号在生成过程中拥有更高的抽中概率，以此来模拟数字出现的热度趋势。'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 flex justify-between items-center">
                  <span>生成组数</span>
                  <span className="text-brand-orange font-semibold bg-brand-orange/10 px-2 py-0.5 rounded border border-brand-orange/20">{sets} 组</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sets}
                  onChange={(e) => setSets(parseInt(e.target.value))}
                  className="w-full accent-brand-orange h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-600 mt-3 font-mono">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                className="w-full mt-2 bg-[#FF8A00] text-white font-bold py-3.5 rounded-xl hover:bg-[#E67A00] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 shadow-md"
              >
                <Zap size={18} className="fill-white" />
                立即生成
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-8">
            <div className="glass-effect rounded-3xl p-8 min-h-[500px] shadow-sm dark:shadow-none">
              <h3 className="text-lg font-medium mb-8 text-slate-800 dark:text-slate-300">推荐结果</h3>
              
              {generated.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 min-h-[300px]">
                  <Dices size={48} className="mb-4 opacity-40 dark:opacity-20 text-brand-orange" />
                  <p className="text-sm">点击左侧按钮生成您的幸运号码</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generated.map((res, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 hover:border-brand-orange/30 rounded-2xl p-5 flex flex-col group transition-all duration-300 hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(255,138,0,0.05)]">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <span className="w-8 text-slate-400 dark:text-slate-600 font-mono text-sm font-medium">#{String(idx + 1).padStart(2, '0')}</span>
                          <div className="flex flex-wrap gap-2">
                            {res.front.map((n, i) => (
                              <span key={`f-${i}`} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 flex items-center justify-center font-medium text-base shadow-sm dark:shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]">
                                {n}
                              </span>
                            ))}
                            <span className="w-4 flex items-center justify-center text-slate-400 dark:text-slate-700 font-light">+</span>
                            {res.back.map((n, i) => (
                              <span key={`b-${i}`} className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-medium text-base shadow-sm dark:shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]">
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(res.front, res.back, idx)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all md:w-auto w-full ${
                            copied === idx 
                              ? 'bg-brand-orange/10 dark:bg-brand-orange/20 text-brand-orange border border-brand-orange/30' 
                              : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-slate-300 border border-slate-200 dark:border-transparent shadow-sm dark:shadow-none'
                          }`}
                        >
                          {copied === idx ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                          {copied === idx ? '已复制' : '复制'}
                        </button>
                      </div>
                      
                      {/* Reason Subtext */}
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-500">
                        <Lightbulb size={14} className="text-brand-orange/70 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">{res.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


