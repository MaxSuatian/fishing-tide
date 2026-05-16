/**
 * 海南主要港口/钓点潮汐谐波常数数据库
 * 主要分潮：K1, O1, P1, Q1, M2, S2, N2, K2, M4, MS4
 * 海南以全日潮为主 (K1, O1 占主导)
 * 振幅单位: 厘米 (cm) | 迟角单位: 度 (°)
 * 数据来源: 基于南海潮汐公开文献和潮汐表估算
 */

const STATIONS = [
  {
    id: 'haikou',
    name: '海口港',
    region: '海口',
    desc: '琼州海峡，海口湾',
    lat: 20.04,
    lon: 110.28,
    timezone: 8,
    h0: 150, // 平均海平面 (cm)
    constituents: [
      { name: 'K1', amp: 42, phase: 285 },
      { name: 'O1', amp: 33, phase: 268 },
      { name: 'P1', amp: 14, phase: 283 },
      { name: 'Q1', amp: 6, phase: 255 },
      { name: 'M2', amp: 24, phase: 155 },
      { name: 'S2', amp: 12, phase: 175 },
      { name: 'N2', amp: 5, phase: 148 },
      { name: 'K2', amp: 3, phase: 178 },
      { name: 'M4', amp: 2, phase: 45 },
      { name: 'MS4', amp: 1, phase: 60 }
    ]
  },
  {
    id: 'macun',
    name: '马村港',
    region: '澄迈',
    desc: '澄迈县，琼州海峡西',
    lat: 19.95,
    lon: 110.08,
    timezone: 8,
    h0: 150,
    constituents: [
      { name: 'K1', amp: 44, phase: 282 },
      { name: 'O1', amp: 35, phase: 265 },
      { name: 'P1', amp: 15, phase: 280 },
      { name: 'Q1', amp: 6, phase: 252 },
      { name: 'M2', amp: 22, phase: 160 },
      { name: 'S2', amp: 11, phase: 180 },
      { name: 'N2', amp: 5, phase: 152 },
      { name: 'K2', amp: 3, phase: 182 },
      { name: 'M4', amp: 1, phase: 50 },
      { name: 'MS4', amp: 1, phase: 65 }
    ]
  },
  {
    id: 'yangpu',
    name: '洋浦港',
    region: '儋州',
    desc: '儋州洋浦湾，北部湾东岸',
    lat: 19.73,
    lon: 109.20,
    timezone: 8,
    h0: 155,
    constituents: [
      { name: 'K1', amp: 48, phase: 278 },
      { name: 'O1', amp: 38, phase: 260 },
      { name: 'P1', amp: 16, phase: 276 },
      { name: 'Q1', amp: 7, phase: 248 },
      { name: 'M2', amp: 18, phase: 170 },
      { name: 'S2', amp: 8, phase: 190 },
      { name: 'N2', amp: 4, phase: 162 },
      { name: 'K2', amp: 2, phase: 192 },
      { name: 'M4', amp: 1, phase: 55 },
      { name: 'MS4', amp: 0.5, phase: 70 }
    ]
  },
  {
    id: 'basuo',
    name: '八所港',
    region: '东方',
    desc: '东方市，北部湾南段',
    lat: 19.10,
    lon: 108.62,
    timezone: 8,
    h0: 155,
    constituents: [
      { name: 'K1', amp: 50, phase: 275 },
      { name: 'O1', amp: 40, phase: 258 },
      { name: 'P1', amp: 17, phase: 273 },
      { name: 'Q1', amp: 7, phase: 245 },
      { name: 'M2', amp: 16, phase: 175 },
      { name: 'S2', amp: 7, phase: 195 },
      { name: 'N2', amp: 3, phase: 168 },
      { name: 'K2', amp: 2, phase: 198 },
      { name: 'M4', amp: 1, phase: 58 },
      { name: 'MS4', amp: 0.5, phase: 72 }
    ]
  },
  {
    id: 'sanya',
    name: '三亚港',
    region: '三亚',
    desc: '三亚湾，海南岛南端',
    lat: 18.23,
    lon: 109.50,
    timezone: 8,
    h0: 140,
    constituents: [
      { name: 'K1', amp: 38, phase: 290 },
      { name: 'O1', amp: 30, phase: 272 },
      { name: 'P1', amp: 13, phase: 288 },
      { name: 'Q1', amp: 5, phase: 260 },
      { name: 'M2', amp: 28, phase: 148 },
      { name: 'S2', amp: 14, phase: 168 },
      { name: 'N2', amp: 6, phase: 140 },
      { name: 'K2', amp: 4, phase: 170 },
      { name: 'M4', amp: 2, phase: 42 },
      { name: 'MS4', amp: 1, phase: 58 }
    ]
  },
  {
    id: 'lingshui',
    name: '陵水新村港',
    region: '陵水',
    desc: '陵水黎族自治县，南海',
    lat: 18.42,
    lon: 110.02,
    timezone: 8,
    h0: 145,
    constituents: [
      { name: 'K1', amp: 36, phase: 292 },
      { name: 'O1', amp: 28, phase: 275 },
      { name: 'P1', amp: 12, phase: 290 },
      { name: 'Q1', amp: 5, phase: 262 },
      { name: 'M2', amp: 30, phase: 142 },
      { name: 'S2', amp: 15, phase: 162 },
      { name: 'N2', amp: 6, phase: 135 },
      { name: 'K2', amp: 4, phase: 165 },
      { name: 'M4', amp: 2, phase: 38 },
      { name: 'MS4', amp: 1, phase: 55 }
    ]
  },
  {
    id: 'wanning',
    name: '万宁港北港',
    region: '万宁',
    desc: '万宁市，海南岛东海岸',
    lat: 18.82,
    lon: 110.47,
    timezone: 8,
    h0: 148,
    constituents: [
      { name: 'K1', amp: 40, phase: 288 },
      { name: 'O1', amp: 32, phase: 270 },
      { name: 'P1', amp: 13, phase: 286 },
      { name: 'Q1', amp: 6, phase: 258 },
      { name: 'M2', amp: 26, phase: 152 },
      { name: 'S2', amp: 13, phase: 172 },
      { name: 'N2', amp: 5, phase: 145 },
      { name: 'K2', amp: 3, phase: 175 },
      { name: 'M4', amp: 2, phase: 48 },
      { name: 'MS4', amp: 1, phase: 62 }
    ]
  },
  {
    id: 'boao',
    name: '博鳌港',
    region: '琼海',
    desc: '琼海市博鳌镇，万泉河口',
    lat: 19.15,
    lon: 110.58,
    timezone: 8,
    h0: 148,
    constituents: [
      { name: 'K1', amp: 41, phase: 286 },
      { name: 'O1', amp: 32, phase: 268 },
      { name: 'P1', amp: 14, phase: 284 },
      { name: 'Q1', amp: 6, phase: 256 },
      { name: 'M2', amp: 25, phase: 154 },
      { name: 'S2', amp: 12, phase: 174 },
      { name: 'N2', amp: 5, phase: 146 },
      { name: 'K2', amp: 3, phase: 177 },
      { name: 'M4', amp: 2, phase: 46 },
      { name: 'MS4', amp: 1, phase: 60 }
    ]
  },
  {
    id: 'qinglan',
    name: '清澜港',
    region: '文昌',
    desc: '文昌市清澜镇，东海岸',
    lat: 19.55,
    lon: 110.80,
    timezone: 8,
    h0: 150,
    constituents: [
      { name: 'K1', amp: 43, phase: 284 },
      { name: 'O1', amp: 34, phase: 266 },
      { name: 'P1', amp: 14, phase: 282 },
      { name: 'Q1', amp: 6, phase: 254 },
      { name: 'M2', amp: 23, phase: 156 },
      { name: 'S2', amp: 11, phase: 176 },
      { name: 'N2', amp: 5, phase: 148 },
      { name: 'K2', amp: 3, phase: 179 },
      { name: 'M4', amp: 2, phase: 44 },
      { name: 'MS4', amp: 1, phase: 58 }
    ]
  },
  // 近海钓点 (Offshore fishing spots)
  {
    id: 'qizhou',
    name: '七洲列岛',
    region: '文昌外海',
    desc: '文昌市以东约30公里外海',
    lat: 19.97,
    lon: 111.25,
    timezone: 8,
    h0: 145,
    constituents: [
      { name: 'K1', amp: 44, phase: 282 },
      { name: 'O1', amp: 35, phase: 264 },
      { name: 'P1', amp: 15, phase: 280 },
      { name: 'Q1', amp: 6, phase: 252 },
      { name: 'M2', amp: 22, phase: 158 },
      { name: 'S2', amp: 11, phase: 178 },
      { name: 'N2', amp: 5, phase: 150 },
      { name: 'K2', amp: 3, phase: 180 },
      { name: 'M4', amp: 1, phase: 42 },
      { name: 'MS4', amp: 0.5, phase: 56 }
    ]
  },
  {
    id: 'yongxing',
    name: '永兴岛',
    region: '三沙',
    desc: '西沙群岛永兴岛',
    lat: 16.83,
    lon: 112.33,
    timezone: 8,
    h0: 135,
    constituents: [
      { name: 'K1', amp: 32, phase: 298 },
      { name: 'O1', amp: 25, phase: 280 },
      { name: 'P1', amp: 11, phase: 296 },
      { name: 'Q1', amp: 4, phase: 268 },
      { name: 'M2', amp: 35, phase: 135 },
      { name: 'S2', amp: 18, phase: 155 },
      { name: 'N2', amp: 7, phase: 128 },
      { name: 'K2', amp: 5, phase: 158 },
      { name: 'M4', amp: 3, phase: 30 },
      { name: 'MS4', amp: 2, phase: 45 }
    ]
  }
];
