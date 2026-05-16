/**
 * 天文计算模块
 * - 月相计算 (基于 Julian Day)
 * - 日出日落时间
 * - 月出月落时间
 */

const ASTRONOMY = (() => {
  'use strict';

  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  // 计算儒略日
  function julianDay(year, month, day) {
    let y = year, m = month, d = day;
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }

  // 将 Date 转为儒略日
  function dateToJD(date) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate() + date.getHours() / 24 + date.getMinutes() / 1440 + date.getSeconds() / 86400;
    return julianDay(y, m, d);
  }

  // 将儒略日转为 Date (UTC)
  function jdToDate(jd) {
    const jdi = Math.floor(jd + 0.5);
    const frac = (jd + 0.5) - jdi;
    let a = jdi;
    if (a >= 2299161) {
      const alpha = Math.floor((a - 1867216.25) / 36524.25);
      a += 1 + alpha - Math.floor(alpha / 4);
    }
    const b = a + 1524;
    const c = Math.floor((b - 122.1) / 365.25);
    const d = Math.floor(365.25 * c);
    const e = Math.floor((b - d) / 30.6001);
    const day = b - d - Math.floor(30.6001 * e) + frac;
    const month = e < 14 ? e - 1 : e - 13;
    const year = month > 2 ? c - 4716 : c - 4715;
    const hour = (day - Math.floor(day)) * 24;
    const minute = (hour - Math.floor(hour)) * 60;
    const second = (minute - Math.floor(minute)) * 60;
    return new Date(Date.UTC(year, month - 1, Math.floor(day), Math.floor(hour), Math.floor(minute), Math.floor(second)));
  }

  // === 太阳位置计算 ===
  function sunPosition(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * DEG;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
    const sunLong = (280.46646 + 36000.76983 * T + 0.0003032 * T * T + C * RAD) * DEG;
    const eps = (23.43929 - 0.0130042 * T - 0.00000016 * T * T) * DEG;
    const ra = Math.atan2(Math.cos(eps) * Math.sin(sunLong), Math.cos(sunLong));
    const dec = Math.asin(Math.sin(eps) * Math.sin(sunLong));
    return { ra, dec, eps };
  }

  // === 月球位置计算 (简化版) ===
  function moonPosition(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    const D = (297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + 1.0/545868.0 * T * T * T - 1.0/113065000.0 * T * T * T * T) * DEG;
    const M = (357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + 1.0/24490000.0 * T * T * T) * DEG;
    const Mp = (134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + 1.0/69699.0 * T * T * T - 1.0/14712000.0 * T * T * T * T) * DEG;
    const F = (93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - 1.0/3526000.0 * T * T * T + 1.0/863310000.0 * T * T * T * T) * DEG;

    // 月球黄经 (简化)
    const l = 0.0;
    const Bm = 0.0;
    const lon = D + M + Mp; // 简化
    const lat = 0;

    return { lon: D + Mp, lat: 0 };
  }

  // === 月相计算 ===
  function getMoonPhase(date) {
    const jd = dateToJD(date);
    // 已知新月的 JD: 2000-01-06 06:14 UTC ≈ 2451549.5
    const newMoonJD = 2451549.5;
    const lunation = (jd - newMoonJD) / 29.53058867;
    const phase = ((lunation % 1) + 1) % 1;

    // 月相名称
    let name, icon;
    if (phase < 0.03 || phase > 0.97) {
      name = '新月';
      icon = '🌑';
    } else if (phase < 0.23) {
      name = '蛾眉月';
      icon = '🌒';
    } else if (phase < 0.27) {
      name = '上弦月';
      icon = '🌓';
    } else if (phase < 0.48) {
      name = '盈凸月';
      icon = '🌔';
    } else if (phase < 0.52) {
      name = '满月';
      icon = '🌕';
    } else if (phase < 0.73) {
      name = '亏凸月';
      icon = '🌖';
    } else if (phase < 0.77) {
      name = '下弦月';
      icon = '🌗';
    } else {
      name = '残月';
      icon = '🌘';
    }

    // 农历日 (初一 = 1)
    const lunarDay = Math.floor(phase * 29.53058867) + 1;

    // 照明百分比
    const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2;

    return { phase, name, icon, lunarDay, illumination: Math.round(illumination * 100) };
  }

  // === 日出日落计算 ===
  function getSunTimes(date, lat, lon) {
    const jd = dateToJD(date);
    const noonJD = Math.floor(jd) + 0.5;

    // 计算正午太阳高度
    const sunNoon = sunPosition(noonJD);
    const sinL = Math.sin(lat * DEG);
    const cosL = Math.cos(lat * DEG);

    // 日出时角
    const cosHA = (Math.cos(90.833 * DEG) - sinL * Math.sin(sunNoon.dec)) / (cosL * Math.cos(sunNoon.dec));

    if (cosHA < -1) return { sunrise: null, sunset: null, polarDay: true, polarNight: false };
    if (cosHA > 1) return { sunrise: null, sunset: null, polarDay: false, polarNight: true };

    const HA = Math.acos(cosHA); // 时角 (弧度)
    const lonOffset = lon / 360 * 24; // 经度时间偏移 (小时)

    // 黎明民用晨光始取 -6°
    const cosHA6 = (Math.cos(96 * DEG) - sinL * Math.sin(sunNoon.dec)) / (cosL * Math.cos(sunNoon.dec));
    let dawnHA = HA;
    if (cosHA6 > -1 && cosHA6 < 1) dawnHA = Math.acos(cosHA6);

    // 太阳正午时间 (UTC)
    const noon = 12 - lonOffset;

    const sunriseUTC = noon - HA * RAD / 15;
    const sunsetUTC = noon + HA * RAD / 15;
    const dawnUTC = noon - dawnHA * RAD / 15;
    const duskUTC = noon + dawnHA * RAD / 15;

    function formatTime(utcHours, tz) {
      const h = (utcHours + tz + 24) % 24;
      const hour = Math.floor(h);
      const min = Math.floor((h - hour) * 60);
      return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    }

    return {
      sunrise: formatTime(sunriseUTC, 8),
      sunset: formatTime(sunsetUTC, 8),
      dawn: formatTime(dawnUTC, 8),
      dusk: formatTime(duskUTC, 8),
      polarDay: false,
      polarNight: false
    };
  }

  // === 月出月落计算 (粗略) ===
  function getMoonTimes(date, lat, lon) {
    const jd = dateToJD(date);
    const noonJD = Math.floor(jd) + 0.5;
    const mp = moonPosition(noonJD);

    // 粗略: 月出约比前一天晚 50 分钟
    // 用简化的方式估算
    const moonPhase = getMoonPhase(date);
    const phaseOffset = moonPhase.phase * 24; // 月出相位偏移 (小时)

    // 粗略月出时间 = 日落 + 相位偏移
    const sunTimes = getSunTimes(date, lat, lon);
    if (!sunTimes.sunset || !sunTimes.sunrise) return { moonrise: '--:--', moonset: '--:--' };

    // 月出 ≈ 日出时间 + 相位偏移 (0 = 新月, 0.5 = 满月)
    const mrHour = parseFloat(sunTimes.sunrise.split(':')[0]) + parseFloat(sunTimes.sunrise.split(':')[1]) / 60 + phaseOffset * 0.85;
    const msHour = mrHour + 12;

    function fmt(h) {
      const hh = ((h % 24) + 24) % 24;
      return `${Math.floor(hh).toString().padStart(2, '0')}:${Math.floor((hh % 1) * 60).toString().padStart(2, '0')}`;
    }

    return {
      moonrise: fmt(mrHour),
      moonset: fmt(msHour)
    };
  }

  return {
    getMoonPhase,
    getSunTimes,
    getMoonTimes
  };
})();
