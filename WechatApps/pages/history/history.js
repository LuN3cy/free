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