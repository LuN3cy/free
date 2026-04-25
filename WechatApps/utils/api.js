const app = getApp();
const request = (url, method = 'GET', data = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiBaseUrl}${url}`,
      method,
      data,
      success: (res) => {
        if (res.statusCode !== 200) {
          reject(`请求失败 (${res.statusCode})`);
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