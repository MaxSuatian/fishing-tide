/**
 * 主应用逻辑
 * 协调各模块工作
 */

(function () {
  'use strict';

  // 当前状态
  let currentStation = null;
  let currentDate = new Date();
  let currentExtremes = null;
  let currentWeather = null;

  // 初始化
  function init() {
    // 设置默认日期为今天
    resetToToday();

    // 加载站点列表
    UI.populateStations(STATIONS);

    // 选择第一个站点
    const firstId = STATIONS[0].id;
    UI.els.stationSelect.value = firstId;

    // 站点切换事件
    UI.onStationChange(() => {
      refreshAll();
    });

    // 日期导航
    UI.els.prevDay.addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() - 1);
      refreshAll();
    });

    UI.els.nextDay.addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() + 1);
      refreshAll();
    });

    UI.els.todayBtn.addEventListener('click', () => {
      resetToToday();
      refreshAll();
    });

    // 首次刷新
    refreshAll();
  }

  function resetToToday() {
    currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
  }

  // 刷新所有数据
  async function refreshAll() {
    const stationId = UI.getSelectedStationId();
    currentStation = STATIONS.find(s => s.id === stationId);
    if (!currentStation) return;

    UI.showLoading(true);
    UI.updateDateDisplay(currentDate);

    // 并行计算 (潮汐 + 天文)
    try {
      // 1. 潮汐计算
      const extremes = TIDE.findExtremes(currentStation, currentDate);
      currentExtremes = extremes;

      const tideType = TIDE.getTideType(currentStation, extremes);
      UI.setTideType(tideType);

      // 2. 绘制潮汐曲线
      UI.drawTideChart(currentStation, currentDate, extremes);

      // 3. 潮汐极值表
      UI.renderTideExtremes(extremes);

      // 4. 天文信息
      UI.renderAstro(currentStation, currentDate);

      // 5. 钓鱼指数 (先画，天气异步不影响)
      UI.renderFishIndex(currentStation, currentDate, extremes, currentWeather);

      // 6. 天气 (异步)
      fetchWeather();

      UI.showLoading(false);

    } catch (e) {
      console.error('刷新失败:', e);
      UI.showLoading(false);
    }
  }

  // 获取天气
  async function fetchWeather() {
    if (!currentStation) return;

    UI.showWeatherLoading();

    try {
      const weather = await WEATHER.getWeather(currentStation.lat, currentStation.lon);
      currentWeather = weather;
      UI.renderWeather(weather);

      // 更新钓鱼指数包含天气
      if (currentStation && currentExtremes) {
        UI.renderFishIndex(currentStation, currentDate, currentExtremes, currentWeather);
      }
    } catch (e) {
      console.warn('天气获取失败:', e);
      UI.showWeatherError('天气数据获取失败，请检查网络连接');
    }
  }

  // 页面加载完成后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
