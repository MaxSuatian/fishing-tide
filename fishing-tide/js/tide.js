/**
 * 潮汐谐波计算引擎
 * 使用调和常数法 (Harmonic Method) 计算潮位
 * 公式: h(t) = H0 + Σ A_i * cos(ω_i * t + V0_i + u_i - g_i)
 *
 * 对于工程应用，简化为:
 * h(t) = H0 + Σ A_i * cos(ω_i * t - g_i + v_i)
 * 其中 v_i 是与天文因素相关的初相角
 */

const TIDE = (() => {
  'use strict';

  // 分潮角速度 (度/小时)
  const SPEED = {
    M2: 28.984104,
    S2: 30.000000,
    N2: 28.439729,
    K2: 30.082137,
    K1: 15.041069,
    O1: 13.943035,
    P1: 14.958931,
    Q1: 13.398660,
    M4: 57.968208,
    MS4: 60.000000
  };

  // 主要分潮的天文初相角 V0 (u, 于 2000-01-01 00:00 UTC)
  // 这里用简化近似，实际计算需要考虑随时间变化
  function astronomicalArgument(d0, name) {
    // d0: 自 2000-01-01 00:00 UTC 起的天数 (儒略日数)
    // 返回分潮的初相角(度)
    const T = d0 / 36525.0; // 儒略世纪数
    const s = (218.3167 + 481267.8813 * T) % 360; // 月球平均经度
    const h = (280.4667 + 36000.7697 * T) % 360; // 太阳平均经度
    const p = (83.3535 + 4069.0139 * T) % 360;  // 月球近地点
    const N = (125.0445 - 1934.1363 * T) % 360;  // 月球升交点
    const PP = (282.9383 + 1.7196 * T) % 360;    // 太阳近地点

    const args = {
      M2: 2 * h - 2 * s,
      S2: 0,
      N2: 2 * h - 3 * s + p,
      K2: 2 * h + 2 * s,
      K1: h + 90,
      O1: h - 2 * s - 90,
      P1: h - 90,
      Q1: h - 3 * s + p - 90,
      M4: 4 * h - 4 * s,
      MS4: 2 * h + 2 * h - 2 * s
    };

    let v = args[name] || 0;
    // 归化到 0-360
    v = ((v % 360) + 360) % 360;
    return v;
  }

  // 节点修正因子 u (简化为0，实际有 ~±2° 的影响)
  function nodalFactor(name, T) {
    const N = (125.0445 - 1934.1363 * T) % 360;
    const u = {
      M2: 0,
      S2: 0,
      N2: 0,
      K2: 2 * N,
      K1: -N,
      O1: 0,
      P1: 0,
      Q1: 0,
      M4: 0,
      MS4: 0
    };
    return (u[name] || 0);
  }

  // 计算某时刻的潮位
  // station: stations.js 中的站点对象
  // date: Date 对象 (当地时间)
  function calculateHeight(station, date) {
    // 将当地时间转为 UTC
    const utc = new Date(date.getTime() - station.timezone * 3600000);

    // 计算从 2000-01-01 00:00 UTC 起的天数
    const epoch = new Date(Date.UTC(2000, 0, 1, 0, 0, 0));
    const d0 = (utc - epoch) / 86400000;
    const T = d0 / 36525.0;

    // 计算从当天 00:00 UTC 起的小时数
    const hoursUTC = utc.getUTCHours() + utc.getUTCMinutes() / 60 + utc.getUTCSeconds() / 3600;

    let height = station.h0;

    for (const c of station.constituents) {
      const speed = SPEED[c.name];
      if (speed === undefined) continue;

      const v0 = astronomicalArgument(d0, c.name);
      const u = nodalFactor(c.name, T);

      // 潮位贡献 = A * cos(ω * t + V0 + u - g)
      // t 是自当天 00:00 UTC 起的小时数
      const arg = (speed * hoursUTC + v0 + u - c.phase) * Math.PI / 180;
      height += c.amp * Math.cos(arg);
    }

    return height / 100; // 转换为米
  }

  // 查找指定日期范围内的高/低潮
  // 用微分法寻找极值点
  function findExtremes(station, date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 0, 0);

    // 时间步长 5 分钟，寻找极值
    const step = 5 / 60; // 小时
    const results = [];
    let prev = calculateHeight(station, start);
    let prevTime = start.getTime();

    for (let m = step; m <= 24; m += step) {
      const t = new Date(start.getTime() + m * 3600000);
      const h = calculateHeight(station, t);
      const curTime = t.getTime();

      // 检测极值：斜率改变方向
      if (results.length === 0 || (h - prev) * (results[results.length - 1].dir) < 0) {
        // 用抛物线插值精确定位
        const hPrev = results.length > 0 ? calculateHeight(station, new Date(prevTime - step * 3600000)) : prev;
        const hCurr = h;
        const hNext = m + step <= 24 ? calculateHeight(station, new Date(t.getTime() + step * 3600000)) : h;

        const a = (hPrev + hNext - 2 * hCurr) / 2;
        if (Math.abs(a) > 0.0001) {
          const dx = (hPrev - hNext) / (4 * a);
          if (Math.abs(dx) <= 1) {
            const peakTime = new Date(curTime + dx * step * 3600000);
            const peakHeight = hCurr - a * dx * dx;
            const isHigh = a < 0;

            // 避免极端相邻极值
            if (results.length > 0) {
              const last = results[results.length - 1];
              const diffMin = (peakTime.getTime() - last.time.getTime()) / 60000;
              if (diffMin < 30) {
                // 保留更大的极值
                if ((isHigh && peakHeight > last.height) || (!isHigh && peakHeight < last.height)) {
                  results.pop();
                } else {
                  prev = h;
                  prevTime = curTime;
                  continue;
                }
              }
            }

            results.push({
              time: peakTime,
              height: Math.round(peakHeight * 100) / 100,
              type: isHigh ? 'high' : 'low',
              dir: isHigh ? -1 : 1
            });
          }
        }
      }

      prev = h;
      prevTime = curTime;
    }

    // 确保第一个和最后一个极值类型不同 (高/低交替)
    const filtered = [results[0]];
    for (let i = 1; i < results.length; i++) {
      if (results[i].type !== filtered[filtered.length - 1].type) {
        filtered.push(results[i]);
      }
    }

    return filtered;
  }

  // 获取当日潮汐类型
  function getTideType(station, extremes) {
    const highCount = extremes.filter(e => e.type === 'high').length;
    const lowCount = extremes.filter(e => e.type === 'low').length;

    // 全日潮: 通常一天一次高潮和低潮 (海南多为全日潮)
    // 混合潮: 介于两者之间
    // 半日潮: 一天两次高潮和低潮

    const totalExtremes = highCount + lowCount;

    if (totalExtremes <= 2) return '全日潮';
    if (totalExtremes <= 3) return '混合潮';
    return '半日潮';
  }

  // 获取指定时刻的潮汐趋势 (涨/落/平)
  function getTrend(station, date) {
    const h = calculateHeight(station, date);
    const t1 = new Date(date.getTime() + 30 * 60000); // 30分钟后
    const h1 = calculateHeight(station, t1);

    const diff = h1 - h;
    if (Math.abs(diff) < 0.03) return 'slack';
    return diff > 0 ? 'rising' : 'falling';
  }

  return {
    calculateHeight,
    findExtremes,
    getTideType,
    getTrend
  };
})();
