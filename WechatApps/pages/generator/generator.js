const { request } = require('../../utils/api');

Page({
  data: {
    mode: 'random',
    sets: 5,
    generated: [],
    stats: null
  },
  onLoad() {
    request('/lottery/stats').then(stats => {
      this.setData({ stats });
    }).catch(() => {
      console.log('Stats未加载');
    });
  },
  setMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
  },
  setSets(e) {
    this.setData({ sets: e.detail.value });
  },
  generateRandom(max, count) {
    const nums = new Set();
    while (nums.size < count) {
      nums.add(Math.floor(Math.random() * max) + 1);
    }
    return Array.from(nums).sort((a, b) => a - b).map(n => n.toString().padStart(2, '0'));
  },
  generatePredicted(hotData, count, type) {
    if (!hotData || hotData.length === 0) {
      return { nums: this.generateRandom(type === 'front' ? 35 : 12, count), reasonData: { hot: 0, cold: 0, avg: 0 } };
    }
    const third = Math.floor(hotData.length / 3);
    const hotNumbers = hotData.slice(0, third);
    const coldNumbers = hotData.slice(-third);
    const avgNumbers = hotData.slice(third, -third);

    const selected = new Set();
    let hotCount = 0, coldCount = 0, avgCount = 0;

    const pickRandomFrom = (arr) => {
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
  },
  handleGenerate() {
    const { mode, sets, stats } = this.data;
    const results = [];
    
    for (let i = 0; i < sets; i++) {
      if (mode === 'random') {
        results.push({
          front: this.generateRandom(35, 5),
          back: this.generateRandom(12, 2),
          reason: '完全随机生成，模拟真实摇奖机的绝对随机性。'
        });
      } else {
        const frontRes = this.generatePredicted(stats ? stats.frontHot : [], 5, 'front');
        const backRes = this.generatePredicted(stats ? stats.backHot : [], 2, 'back');
        results.push({
          front: frontRes.nums,
          back: backRes.nums,
          reason: `前区包含 ${frontRes.reasonData.hot}热 ${frontRes.reasonData.cold}冷 ${frontRes.reasonData.avg}温；后区包含 ${backRes.reasonData.hot}热 ${backRes.reasonData.cold}冷/温。`
        });
      }
    }
    
    this.setData({ generated: results });
    wx.pageScrollTo({ scrollTop: 400, duration: 300 });
  }
});