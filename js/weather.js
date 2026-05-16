/**
 * 天气数据获取 (Open-Meteo API)
 * 免费，无需 API Key
 */

const WEATHER = (() => {
  'use strict';

  const BASE = 'https://api.open-meteo.com/v1/forecast';

  /**
   * 获取指定位置当前天气
   * @param {number} lat - 纬度
   * @param {number} lon - 经度
   * @returns {Promise<Object>} 天气数据
   */
  async function getWeather(lat, lon) {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: ['temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
                 'weather_code', 'wind_speed_10m', 'wind_direction_10m',
                 'pressure_msl'].join(','),
      daily: ['temperature_2m_max', 'temperature_2m_min'].join(','),
      timezone: 'Asia/Shanghai'
    });

    const url = `${BASE}?${params}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`天气 API 请求失败: ${resp.status}`);

    const data = await resp.json();
    return parseWeatherData(data);
  }

  // WMO 天气代码转中文描述
  const WMO_CODES = {
    0: '晴', 1: '大部晴', 2: '多云', 3: '阴',
    45: '雾', 48: '大雾',
    51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨',
    56: '冻毛毛雨', 57: '大冻毛毛雨',
    61: '小雨', 63: '中雨', 65: '大雨',
    66: '冻雨', 67: '大冻雨',
    71: '小雪', 73: '中雪', 75: '大雪',
    80: '阵雨', 81: '中阵雨', 82: '大阵雨',
    95: '雷暴', 96: '雷暴+冰雹', 99: '大雷暴+冰雹'
  };

  function getWeatherDesc(code) {
    return WMO_CODES[code] || '未知';
  }

  function getWindDir(deg) {
    const dirs = ['北', '北东北', '东北', '东东北', '东', '东东南', '东南', '南东南',
                  '南', '南西南', '西南', '西西南', '西', '西西北', '西北', '北西北'];
    const idx = Math.round(deg / 22.5) % 16;
    return dirs[idx] || '北';
  }

  function parseWeatherData(data) {
    const current = data.current;
    if (!current) throw new Error('无天气数据');

    return {
      temp: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      windDir: getWindDir(current.wind_direction_10m),
      windDeg: current.wind_direction_10m,
      pressure: Math.round(current.pressure_msl),
      weatherCode: current.weather_code,
      weatherDesc: getWeatherDesc(current.weather_code),
      tempMax: data.daily ? Math.round(data.daily.temperature_2m_max[0]) : null,
      tempMin: data.daily ? Math.round(data.daily.temperature_2m_min[0]) : null
    };
  }

  return { getWeather };
})();
