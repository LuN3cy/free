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
      wx.showToast({ title: `新增${res.syncedCount}条`, icon: 'success' });
      this.fetchData();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '同步失败，请检查后端', icon: 'none' });
    }).finally(() => {
      this.setData({ syncing: false });
    });
  }
});