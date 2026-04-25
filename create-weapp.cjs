const fs = require('fs');
const path = require('path');

const baseDir = '/workspace/WechatApps';
const dirs = [
  '',
  '/pages',
  '/pages/index',
  '/pages/generator',
  '/pages/history',
  '/utils',
  '/images'
];

dirs.forEach(d => fs.mkdirSync(path.join(baseDir, d), { recursive: true }));

const files = {
  'project.config.json': JSON.stringify({
    miniprogramRoot: "./",
    projectname: "SuperLotto",
    description: "大乐透预测生成器",
    appid: "touristappid",
    setting: {
      urlCheck: false,
      es6: true,
      postcss: true,
      minified: true
    },
    compileType: "miniprogram"
  }, null, 2),
  'app.json': JSON.stringify({
    pages: [
      "pages/index/index",
      "pages/generator/generator",
      "pages/history/history"
    ],
    window: {
      backgroundTextStyle: "light",
      navigationBarBackgroundColor: "#0f172a",
      navigationBarTitleText: "财富自由FREE",
      navigationBarTextStyle: "white"
    },
    tabBar: {
      color: "#64748b",
      selectedColor: "#f97316",
      backgroundColor: "#ffffff",
      list: [
        { pagePath: "pages/index/index", text: "大盘" },
        { pagePath: "pages/generator/generator", text: "生成" },
        { pagePath: "pages/history/history", text: "走势" }
      ]
    },
    style: "v2",
    sitemapLocation: "sitemap.json"
  }, null, 2),
  'sitemap.json': JSON.stringify({ rules: [{ action: "allow", page: "*" }] }, null, 2),
  'app.js': `App({ 
  globalData: { 
    // 请替换为你部署在 Vercel 上的真实 API 地址，例如 'https://your-app.vercel.app/api'
    // 如果在本地微信开发者工具中使用，可以保持使用本地后端
    apiBaseUrl: 'http://localhost:3001/api' 
  } 
})`,
  'app.wxss': `
page {
  background-color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
  color: #334155;
  box-sizing: border-box;
}
.container {
  padding: 30rpx;
  padding-bottom: 60rpx;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}
.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #0f172a;
  display: block;
}
.subtitle {
  font-size: 24rpx;
  color: #64748b;
  margin-top: 10rpx;
  display: block;
}
.card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.04);
}
.card-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  color: #1e293b;
  border-left: 8rpx solid #f97316;
  padding-left: 16rpx;
  line-height: 1.2;
}
.balls {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}
.ball {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
  color: white;
  box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}
.ball.red {
  background: linear-gradient(135deg, #f87171, #dc2626);
}
.ball.blue {
  background: linear-gradient(135deg, #60a5fa, #2563eb);
}
.plus {
  font-size: 40rpx;
  color: #94a3b8;
  margin: 0 10rpx;
}
  `,
  'utils/api.js': `
const app = getApp();
const request = (url, method = 'GET', data = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: \`\${app.globalData.apiBaseUrl}\${url}\`,
      method,
      data,
      success: (res) => {
        if (res.statusCode !== 200) {
          reject(\`请求失败 (\${res.statusCode})\`);
        } else if (res.data && res.data.success) {
          resolve(res.data.data);
        } else {
          reject(res.data ? res.data.error : '请求失败');
        }
      },
      fail: (err) => {
        reject('网络错误: ' + err.errMsg);
      }
    });
  });
};
module.exports = { request };
  `,
  'pages/index/index.wxml': `
<view class="container">
  <view class="header">
    <view>
      <text class="title">大盘概览</text>
      <text class="subtitle">最新开奖与数据状态</text>
    </view>
    <button class="sync-btn" bindtap="handleSync" loading="{{syncing}}">同步数据</button>
  </view>

  <view class="card" wx:if="{{latestRecord}}">
    <view class="card-title">最新一期: 第 {{latestRecord.period}} 期</view>
    <view class="balls">
      <view class="ball red" wx:for="{{latestRecord.front_zone}}" wx:key="*this">{{item}}</view>
      <view class="plus">+</view>
      <view class="ball blue" wx:for="{{latestRecord.back_zone}}" wx:key="*this">{{item}}</view>
    </view>
    <view class="date">开奖日期: {{latestRecord.draw_date}}</view>
  </view>
  <view class="empty" wx:elif="{{!loading}}">暂无数据，请点击同步</view>

  <view class="card" wx:if="{{stats}}">
    <view class="card-title">数据库状态</view>
    <view class="stat-row">总收录期数: <text class="highlight">{{stats.totalRecords}}</text></view>
    <view class="stat-desc">前区：35选5 | 后区：12选2</view>
    <view class="stat-desc" style="opacity: 0.7; margin-top: 10rpx;">用于为您提供更加精准的历史频率计算及随机选号参考。</view>
  </view>
</view>
  `,
  'pages/index/index.wxss': `
.sync-btn {
  background: #f97316;
  color: white;
  font-size: 26rpx;
  margin: 0;
  padding: 0 30rpx;
  border-radius: 40rpx;
  height: 64rpx;
  line-height: 64rpx;
}
.date {
  text-align: center;
  color: #64748b;
  font-size: 24rpx;
  background: #f1f5f9;
  padding: 16rpx;
  border-radius: 12rpx;
}
.stat-row {
  font-size: 32rpx;
  color: #334155;
  margin-bottom: 10rpx;
}
.highlight {
  color: #f97316;
  font-size: 44rpx;
  font-weight: bold;
  margin-left: 10rpx;
}
.stat-desc {
  font-size: 24rpx;
  color: #94a3b8;
  margin-top: 20rpx;
}
.empty {
  text-align: center;
  color: #94a3b8;
  padding: 60rpx 0;
}
  `,
  'pages/index/index.js': `
const { request } = require('../../utils/api');

Page({
  data: {
    latestRecord: null,
    stats: null,
    syncing: false,
    loading: true
  },
  onShow() {
    this.fetchData();
  },
  fetchData() {
    this.setData({ loading: true });
    Promise.all([
      request('/lottery/latest?limit=1'),
      request('/lottery/stats')
    ]).then(([records, stats]) => {
      if (records.length > 0) {
        records[0].front_zone = records[0].front_zone.split(',');
        records[0].back_zone = records[0].back_zone.split(',');
      }
      this.setData({ latestRecord: records[0] || null, stats, loading: false });
    }).catch(err => {
      wx.showToast({ title: '接口未连接或出错', icon: 'none' });
      this.setData({ loading: false });
    });
  },
  handleSync() {
    if (this.data.syncing) return;
    this.setData({ syncing: true });
    wx.showLoading({ title: '同步中...' });
    request('/lottery/sync', 'POST').then(res => {
      wx.hideLoading();
      wx.showToast({ title: \`新增\${res.syncedCount}条\`, icon: 'success' });
      this.fetchData();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '同步失败，请检查后端', icon: 'none' });
    }).finally(() => {
      this.setData({ syncing: false });
    });
  }
});
  `,
  'pages/generator/generator.wxml': `
<view class="container">
  <view class="header">
    <view>
      <text class="title">号码生成</text>
      <text class="subtitle">随机或智能预测</text>
    </view>
  </view>

  <view class="card">
    <view class="card-title">生成配置</view>
    <view class="config-row">
      <text class="label">模式</text>
      <view class="tabs">
        <view class="tab {{mode === 'random' ? 'active' : ''}}" bindtap="setMode" data-mode="random">完全随机</view>
        <view class="tab {{mode === 'predict' ? 'active' : ''}}" bindtap="setMode" data-mode="predict">智能预测</view>
      </view>
    </view>
    
    <view class="config-row">
      <text class="label">生成组数: {{sets}}</text>
      <slider min="1" max="10" value="{{sets}}" bindchange="setSets" activeColor="#f97316" block-color="#ffffff"/>
    </view>
    
    <button class="gen-btn" bindtap="handleGenerate">立即生成</button>
  </view>

  <view class="card result-card" wx:for="{{generated}}" wx:key="index">
    <view class="balls">
      <view class="ball red" wx:for="{{item.front}}" wx:key="*this" wx:for-item="num">{{num}}</view>
      <view class="plus">+</view>
      <view class="ball blue" wx:for="{{item.back}}" wx:key="*this" wx:for-item="num">{{num}}</view>
    </view>
    <view class="reason">{{item.reason}}</view>
  </view>
</view>
  `,
  'pages/generator/generator.wxss': `
.config-row {
  margin-bottom: 40rpx;
}
.label {
  font-size: 28rpx;
  color: #475569;
  display: block;
  margin-bottom: 20rpx;
}
.tabs {
  display: flex;
  background: #f1f5f9;
  border-radius: 16rpx;
  padding: 8rpx;
}
.tab {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  padding: 20rpx 0;
  border-radius: 12rpx;
  color: #64748b;
  transition: all 0.2s;
}
.tab.active {
  background: #ffffff;
  color: #f97316;
  font-weight: bold;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}
.gen-btn {
  background: #f97316;
  color: white;
  font-weight: bold;
  border-radius: 20rpx;
  margin-top: 40rpx;
  font-size: 32rpx;
  padding: 10rpx 0;
}
.result-card {
  padding: 30rpx;
}
.reason {
  font-size: 24rpx;
  color: #64748b;
  background: #f8fafc;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-top: 20rpx;
  line-height: 1.5;
}
  `,
  'pages/generator/generator.js': `
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
          reason: \`前区包含 \${frontRes.reasonData.hot}热 \${frontRes.reasonData.cold}冷 \${frontRes.reasonData.avg}温；后区包含 \${backRes.reasonData.hot}热 \${backRes.reasonData.cold}冷/温。\`
        });
      }
    }
    
    this.setData({ generated: results });
    wx.pageScrollTo({ scrollTop: 400, duration: 300 });
  }
});
  `,
  'pages/history/history.wxml': `
<view class="container">
  <view class="header">
    <view>
      <text class="title">历史走势</text>
      <text class="subtitle">前区与后区冷热分布</text>
    </view>
  </view>

  <view wx:if="{{!stats}}" class="loading">加载中...</view>
  
  <block wx:else>
    <view class="card">
      <view class="card-title">前区冷热频率 (35选5)</view>
      <view class="stat-item" wx:for="{{stats.frontHot}}" wx:key="number">
        <view class="num-label red">{{item.number}}</view>
        <view class="bar-bg">
          <view class="bar-fill red" style="width: {{(item.count / maxFront) * 100}}%"></view>
        </view>
        <view class="count">{{item.count}}次</view>
      </view>
    </view>

    <view class="card">
      <view class="card-title">后区冷热频率 (12选2)</view>
      <view class="stat-item" wx:for="{{stats.backHot}}" wx:key="number">
        <view class="num-label blue">{{item.number}}</view>
        <view class="bar-bg">
          <view class="bar-fill blue" style="width: {{(item.count / maxBack) * 100}}%"></view>
        </view>
        <view class="count">{{item.count}}次</view>
      </view>
    </view>
  </block>
</view>
  `,
  'pages/history/history.wxss': `
.loading {
  text-align: center;
  color: #94a3b8;
  padding: 60rpx;
  font-size: 28rpx;
}
.stat-item {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  gap: 20rpx;
}
.num-label {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
}
.num-label.red {
  background: #ef4444;
}
.num-label.blue {
  background: #3b82f6;
}
.bar-bg {
  flex: 1;
  height: 16rpx;
  background: #f1f5f9;
  border-radius: 8rpx;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.5s ease-out;
}
.bar-fill.red {
  background: linear-gradient(90deg, #fca5a5, #ef4444);
}
.bar-fill.blue {
  background: linear-gradient(90deg, #93c5fd, #3b82f6);
}
.count {
  font-size: 24rpx;
  color: #64748b;
  width: 70rpx;
  text-align: right;
  flex-shrink: 0;
}
  `,
  'pages/history/history.js': `
const { request } = require('../../utils/api');

Page({
  data: {
    stats: null,
    maxFront: 1,
    maxBack: 1
  },
  onLoad() {
    request('/lottery/stats').then(stats => {
      this.setData({
        stats,
        maxFront: stats.frontHot && stats.frontHot.length > 0 ? stats.frontHot[0].count : 1,
        maxBack: stats.backHot && stats.backHot.length > 0 ? stats.backHot[0].count : 1
      });
    }).catch(() => {
      wx.showToast({ title: '接口加载失败', icon: 'none' });
    });
  }
});
  `
};

for (const [filename, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(baseDir, filename), content.trim());
}

console.log('Wechat Mini Program generated successfully.');
