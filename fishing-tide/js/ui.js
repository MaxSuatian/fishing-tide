/**
 * UI 渲染模块
 * 负责所有 DOM 更新和 Canvas 绘制
 */

const UI = (() => {
  'use strict';

  // 缓存 DOM 引用
  const $ = (id) => document.getElementById(id);

  const els = {
    stationSelect: $('stationSelect'),
    dateDisplay: $('dateDisplay'),
    prevDay: $('prevDay'),
    nextDay: $('nextDay'),
    todayBtn: $('todayBtn'),
    loadingBar: $('loadingBar'),
    tideChart: $('tideChart'),
    tideExtremes: $('tideExtremes'),
    tideType: $('tideType'),
    weatherContent: $('weatherContent'),
    astroContent: $('astroContent'),
    fishIndexContent: $('fishIndexContent')
  };

  // === 站点选择器 ===
  function populateStations(stations) {
    const grouped = {};
    for (const s of stations) {
      if (!grouped[s.region]) grouped[s.region] = [];
      grouped[s.region].push(s);
    }

    els.stationSelect.innerHTML = '';
    for (const [region, list] of Object.entries(grouped)) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = region;
      for (const s of list) {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.desc ? `${s.name} (${s.desc})` : s.name;
        optgroup.appendChild(opt);
      }
      els.stationSelect.appendChild(optgroup);
    }
  }

  function getSelectedStationId() {
    return els.stationSelect.value;
  }

  function onStationChange(callback) {
    els.stationSelect.addEventListener('change', callback);
  }

  // === 日期显示 ===
  function updateDateDisplay(date) {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const w = weekdays[date.getDay()];
    const today = new Date();
    const isToday = date.getFullYear() === today.getFullYear() &&
                    date.getMonth() === today.getMonth() &&
                    date.getDate() === today.getDate();

    const prefix = isToday ? '今天 ' : '';
    els.dateDisplay.textContent = `${prefix}${m}月${d}日 星期${w}`;
  }

  // === 潮汐曲线图 (Canvas) ===
  function drawTideChart(station, date, extremes) {
    const canvas = els.tideChart;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const PAD = { top: 20, bottom: 28, left: 38, right: 20 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);

    // 计算 24 小时潮位数据 (每10分钟)
    const points = [];
    let minH = Infinity, maxH = -Infinity;
    for (let m = 0; m <= 144; m++) { // 24小时 × 6个点/小时 = 144
      const t = new Date(date.getTime() + m * 10 * 60000);
      const h = TIDE.calculateHeight(station, t);
      points.push({ t, h, m });
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
    }

    // 留边距
    const range = maxH - minH || 0.5;
    const yPad = range * 0.12;
    minH -= yPad;
    maxH += yPad;
    const rangeAdj = maxH - minH;

    function xPos(m) { return PAD.left + (m / 144) * chartW; }
    function yPos(h) { return PAD.top + chartH - ((h - minH) / rangeAdj) * chartH; }

    // 背景网格
    ctx.strokeStyle = 'rgba(154, 174, 201, 0.12)';
    ctx.lineWidth = 0.5;
    for (let hour = 0; hour <= 24; hour++) {
      const x = xPos(hour * 6);
      ctx.beginPath();
      ctx.moveTo(x, PAD.top);
      ctx.lineTo(x, PAD.top + chartH);
      ctx.stroke();
    }

    // 水平参考线 (半米格)
    const refStep = Math.max(0.2, Math.round(rangeAdj / 6 * 10) / 10);
    const startRef = Math.floor(minH / refStep) * refStep;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(154, 174, 201, 0.4)';
    ctx.font = '10px sans-serif';
    for (let h = startRef; h <= maxH; h += refStep) {
      const y = yPos(h);
      ctx.strokeStyle = 'rgba(154, 174, 201, 0.08)';
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + chartW, y);
      ctx.stroke();
      ctx.fillText(h.toFixed(1) + 'm', PAD.left - 4, y + 3);
    }

    // 时间轴标签
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(154, 174, 201, 0.5)';
    ctx.font = '10px sans-serif';
    for (let hour = 0; hour <= 24; hour += 3) {
      const x = xPos(hour * 6);
      ctx.fillText(`${hour.toString().padStart(2, '0')}:00`, x, H - 6);
    }

    // 填充潮汐曲线
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(points[0].h));
    for (const p of points) {
      ctx.lineTo(xPos(p.m), yPos(p.h));
    }
    ctx.lineTo(xPos(144), PAD.top + chartH);
    ctx.lineTo(xPos(0), PAD.top + chartH);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + chartH);
    grad.addColorStop(0, 'rgba(79, 195, 247, 0.3)');
    grad.addColorStop(0.5, 'rgba(79, 195, 247, 0.12)');
    grad.addColorStop(1, 'rgba(79, 195, 247, 0.02)');
    ctx.fillStyle = grad;
    ctx.fill();

    // 潮汐曲线
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(points[0].h));
    for (const p of points) {
      ctx.lineTo(xPos(p.m), yPos(p.h));
    }
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制高潮/低潮标记
    for (const ext of extremes) {
      const x = xPos((ext.time.getHours() * 60 + ext.time.getMinutes()) / (24 * 60) * 144);
      const y = yPos(ext.height);
      const isHigh = ext.type === 'high';

      // 标记圆点
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = isHigh ? '#ef5350' : '#4fc3f7';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 标签
      const label = `${ext.time.getHours().toString().padStart(2, '0')}:${ext.time.getMinutes().toString().padStart(2, '0')}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = isHigh ? '#ef5350' : '#4fc3f7';
      ctx.font = 'bold 10px sans-serif';
      const labelY = isHigh ? y - 10 : y + 16;
      ctx.fillText(label, x, labelY);
    }

    // 当前时刻指示线
    const now = new Date();
    if (date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()) {
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const xNow = xPos(nowMin / (24 * 60) * 144);

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 213, 79, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xNow, PAD.top);
      ctx.lineTo(xNow, PAD.top + chartH);
      ctx.stroke();
      ctx.setLineDash([]);

      // 当前时刻标签
      ctx.fillStyle = 'rgba(255, 213, 79, 0.8)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('现在', xNow, PAD.top - 4);
    }
  }

  // === 潮汐极值表 ===
  function renderTideExtremes(extremes) {
    if (!extremes || extremes.length === 0) {
      els.tideExtremes.innerHTML = '<div class="mini-loading">暂无数据</div>';
      return;
    }

    let html = '';
    for (const ext of extremes) {
      const h = ext.time.getHours().toString().padStart(2, '0');
      const m = ext.time.getMinutes().toString().padStart(2, '0');
      const typeLabel = ext.type === 'high' ? '高潮' : '低潮';
      html += `
        <div class="tide-extreme-card ${ext.type}">
          <div class="type">${typeLabel}</div>
          <div class="time">${h}:${m}</div>
          <div class="height">${ext.height.toFixed(2)}m</div>
        </div>
      `;
    }

    els.tideExtremes.innerHTML = html;

    // 当前潮位
    const now = new Date();
    if (extremes.length > 0) {
      const currH = TIDE.calculateHeight(STATIONS.find(s => s.id === UI.getSelectedStationId()), now);
      const trend = TIDE.getTrend(STATIONS.find(s => s.id === UI.getSelectedStationId()), now);

      const trendMap = { rising: '↑ 涨潮', falling: '↓ 退潮', slack: '≈ 平潮' };
      const trendClass = { rising: 'rising', falling: 'falling', slack: 'slack' };

      els.tideExtremes.innerHTML += `
        <div class="now-indicator">
          当前潮位 <span class="curr-height">${currH.toFixed(2)}m</span>
          <span class="trend ${trendClass[trend]}">${trendMap[trend]}</span>
        </div>
      `;
    }
  }

  // === 天气 ===
  function renderWeather(weather) {
    if (!weather) {
      els.weatherContent.innerHTML = '<div class="mini-loading">暂无天气数据</div>';
      return;
    }

    const html = `
      <div class="weather-grid">
        <div class="weather-item">
          <span class="label">天气</span>
          <span class="value">${weather.weatherDesc}</span>
        </div>
        <div class="weather-item">
          <span class="label">温度</span>
          <span class="value temp">${weather.temp}°C</span>
          ${weather.tempMax ? `<span style="font-size:0.72rem;color:var(--text2)">${weather.tempMin}~${weather.tempMax}°C</span>` : ''}
        </div>
        <div class="weather-item">
          <span class="label">体感</span>
          <span class="value">${weather.feelsLike}°C</span>
        </div>
        <div class="weather-item">
          <span class="label">湿度</span>
          <span class="value">${weather.humidity}%</span>
        </div>
        <div class="weather-item">
          <span class="label">风速</span>
          <span class="value">${weather.windSpeed} km/h</span>
        </div>
        <div class="weather-item">
          <span class="label">风向</span>
          <span class="value">${weather.windDir}</span>
        </div>
        <div class="weather-item">
          <span class="label">气压</span>
          <span class="value">${weather.pressure} hPa</span>
        </div>
      </div>
    `;

    els.weatherContent.innerHTML = html;
  }

  function showWeatherLoading() {
    els.weatherContent.innerHTML = '<div class="mini-loading">加载天气数据中...</div>';
  }

  function showWeatherError(msg) {
    els.weatherContent.innerHTML = `<div class="weather-error">⚠ ${msg}</div>`;
  }

  // === 天文信息 ===
  function renderAstro(station, date) {
    const moon = ASTRONOMY.getMoonPhase(date);
    const sun = ASTRONOMY.getSunTimes(date, station.lat, station.lon);
    const moonTimes = ASTRONOMY.getMoonTimes(date, station.lat, station.lon);

    const html = `
      <div class="moon-phase">${moon.icon}</div>
      <div class="astro-grid">
        <div class="astro-item">
          <div class="icon">🌙</div>
          <div class="label">月相</div>
          <div class="value">${moon.name}</div>
        </div>
        <div class="astro-item">
          <div class="icon">💡</div>
          <div class="label">照明</div>
          <div class="value">${moon.illumination}%</div>
        </div>
        <div class="astro-item">
          <div class="icon">📅</div>
          <div class="label">农历</div>
          <div class="value">${moon.lunarDay}</div>
        </div>
        <div class="astro-item">
          <div class="icon">🌅</div>
          <div class="label">日出</div>
          <div class="value">${sun.sunrise || '--:--'}</div>
        </div>
        <div class="astro-item">
          <div class="icon">🌇</div>
          <div class="label">日落</div>
          <div class="value">${sun.sunset || '--:--'}</div>
        </div>
        <div class="astro-item">
          <div class="icon">🌄</div>
          <div class="label">晨光</div>
          <div class="value">${sun.dawn || '--:--'}</div>
        </div>
        <div class="astro-item">
          <div class="icon">🌆</div>
          <div class="label">黄昏</div>
          <div class="value">${sun.dusk || '--:--'}</div>
        </div>
        <div class="astro-item">
          <div class="icon">🌙</div>
          <div class="label">月出</div>
          <div class="value">${moonTimes.moonrise}</div>
        </div>
        <div class="astro-item">
          <div class="icon">🌜</div>
          <div class="label">月落</div>
          <div class="value">${moonTimes.moonset}</div>
        </div>
      </div>
    `;

    els.astroContent.innerHTML = html;
  }

  // === 钓鱼指数 ===
  function renderFishIndex(station, date, extremes, weather) {
    // 计算综合钓鱼指数 (0-100)
    let score = 50;

    // 潮汐因素 (权重 40%)
    if (extremes.length >= 2) {
      // 潮差越大越好
      const maxH = Math.max(...extremes.filter(e => e.type === 'high').map(e => e.height));
      const minH = Math.min(...extremes.filter(e => e.type === 'low').map(e => e.height));
      const range = maxH - minH;
      // 潮差 > 1.5m 好, < 0.5m 差
      const tideScore = Math.min(40, Math.max(0, (range - 0.3) / 1.5 * 40));
      score += tideScore - 20; // 基准 20
    }

    // 月相因素 (权重 20%)
    const moon = ASTRONOMY.getMoonPhase(date);
    // 新月和满月前后最好
    const moonScore = 20 * (1 - Math.abs(moon.phase - 0.5) * 1.8);
    score += moonScore - 10;

    // 时段因素 (权重 20%)
    const hour = date.getHours();
    const sun = ASTRONOMY.getSunTimes(date, station.lat, station.lon);
    if (sun.sunrise && sun.sunset) {
      const sunriseH = parseFloat(sun.sunrise.split(':')[0]) + parseFloat(sun.sunrise.split(':')[1]) / 60;
      const sunsetH = parseFloat(sun.sunset.split(':')[0]) + parseFloat(sun.sunset.split(':')[1]) / 60;
      // 日出前后1小时 + 日落前后1小时最佳
      const dawnDiff = Math.abs(hour - sunriseH);
      const duskDiff = Math.abs(hour - sunsetH);
      if (dawnDiff < 2 || duskDiff < 2) {
        score += 10;
      }
    }

    // 天气因素 (权重 20%)
    if (weather) {
      if (weather.weatherCode <= 3) score += 5; // 晴
      else if (weather.weatherCode <= 30) score += 2;
      else score -= 5;

      // 稳定气压
      if (weather.pressure > 1010 && weather.pressure < 1025) score += 5;
      // 风速 < 20km/h
      if (weather.windSpeed < 20) score += 5;
      else if (weather.windSpeed < 30) score += 2;
      else score -= 5;
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    // 评分等级
    let grade, gradeClass;
    if (score >= 70) { grade = '适宜钓鱼'; gradeClass = 'good'; }
    else if (score >= 45) { grade = '一般'; gradeClass = 'fair'; }
    else { grade = '不宜钓鱼'; gradeClass = 'poor'; }

    // 最佳时段推荐 (基于潮汐)
    const bestSlots = [];
    for (let i = 0; i < extremes.length; i++) {
      const ext = extremes[i];
      if (ext.type === 'low') {
        // 低潮前后2小时 (鱼在涨潮时觅食)
        const start = new Date(ext.time.getTime() - 2 * 3600000);
        const end = new Date(ext.time.getTime() + 2 * 3600000);
        const fmtT = (t) => `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`;
        bestSlots.push(`${fmtT(start)}-${fmtT(end)}`);
      }
    }

    const fishTip = (() => {
      const tips = [];
      if (moon.illumination > 80) tips.push('满月前后鱼活性较高，夜钓效果好');
      else if (moon.illumination < 20) tips.push('新月期间鱼觅食活跃，白天出钓效果佳');
      if (weather && weather.windSpeed < 15) tips.push('风平浪静，适合海钓');
      if (weather && weather.weatherCode >= 61 && weather.weatherCode <= 65) tips.push('雨前鱼活性高，是好时机');
      tips.push('涨潮时鱼随潮水觅食，落潮时鱼退回深水区');
      if (tips.length === 1) tips.push('海南海域全年可钓，春秋季最佳');
      return tips.join('；');
    })();

    const html = `
      <div class="fish-index-display">
        <div class="fish-score ${gradeClass}">
          <span class="num">${score}<span style="font-size:0.7rem">分</span></span>
          <span class="label">${grade}</span>
        </div>
        <div class="fish-times">
          ${bestSlots.length > 0 ? `<div class="time-slot"><span class="dot good"></span>最佳时段: ${bestSlots.slice(0, 3).join(', ')}</div>` : ''}
          <div class="time-slot"><span class="dot fair"></span>潮差: ${extremes.length >= 2 ? (Math.max(...extremes.filter(e=>e.type==='high').map(e=>e.height)) - Math.min(...extremes.filter(e=>e.type==='low').map(e=>e.height))).toFixed(2) : '?'}m</div>
          <div class="time-slot"><span class="dot fair"></span>月相: ${moon.name} (光照${moon.illumination}%)</div>
        </div>
      </div>
      <div class="fish-tip">💡 ${fishTip}</div>
    `;

    els.fishIndexContent.innerHTML = html;
  }

  // === 加载状态 ===
  function showLoading(show) {
    els.loadingBar.classList.toggle('hidden', !show);
  }

  // === 潮汐类型(全日潮/半日潮) ===
  function setTideType(type) {
    els.tideType.textContent = type;
  }

  return {
    populateStations,
    getSelectedStationId,
    onStationChange,
    updateDateDisplay,
    drawTideChart,
    renderTideExtremes,
    renderWeather,
    showWeatherLoading,
    showWeatherError,
    renderAstro,
    renderFishIndex,
    showLoading,
    setTideType,
    els
  };
})();
