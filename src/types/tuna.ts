// 金枪鱼物种及其洄游路径数据

export interface MigrationWaypoint {
  lon: number
  lat: number
}

export interface MigrationPath {
  speciesId: string
  speciesName: string
  scientificName: string
  color: string        // RGBA e.g. [0, 180, 255, 220]
  routeName: string
  // 季节性洄游阶段: 0=冬季(繁殖), 1=春季(北迁), 2=夏季(觅食), 3=秋季(南迁)
  waypoints: MigrationWaypoint[]
  // 每段航线的季节标签
  seasonLabels?: string[]
}

export interface TunaSpecies {
  id: string
  name: string
  scientificName: string
  color: string
  maxWeight: string
  status: string
  statusColor: string
}

// ── 物种列表 ───────────────────────────────────────────────────────────
export const TUNA_SPECIES: TunaSpecies[] = [
  {
    id: 'atlantic-bluefin',
    name: '大西洋蓝鳍金枪鱼',
    scientificName: 'Thunnus thynnus',
    color: '#E84545',
    maxWeight: '680 kg',
    status: 'EN 濒危',
    statusColor: '#ff4444',
  },
  {
    id: 'pacific-bluefin',
    name: '太平洋蓝鳍金枪鱼',
    scientificName: 'Thunnus orientalis',
    color: '#FF6B6B',
    maxWeight: '450 kg',
    status: 'VU 易危',
    statusColor: '#ff9944',
  },
  {
    id: 'southern-bluefin',
    name: '南方蓝鳍金枪鱼',
    scientificName: 'Thunnus maccoyii',
    color: '#FFA500',
    maxWeight: '260 kg',
    status: 'EN 濒危',
    statusColor: '#ff4444',
  },
  {
    id: 'yellowfin',
    name: '黄鳍金枪鱼',
    scientificName: 'Thunnus albacares',
    color: '#FFD700',
    maxWeight: '200 kg',
    status: 'NT 近危',
    statusColor: '#aacc00',
  },
  {
    id: 'bigeye',
    name: '大眼金枪鱼',
    scientificName: 'Thunnus obesus',
    color: '#9B59B6',
    maxWeight: '210 kg',
    status: 'VU 易危',
    statusColor: '#ff9944',
  },
  {
    id: 'albacore',
    name: '长鳍金枪鱼',
    scientificName: 'Thunnus alalunga',
    color: '#00D4FF',
    maxWeight: '60 kg',
    status: 'NT 近危',
    statusColor: '#aacc00',
  },
  {
    id: 'skipjack',
    name: '鲣鱼',
    scientificName: 'Katsuwonus pelamis',
    color: '#00FF88',
    maxWeight: '35 kg',
    status: 'LC 无危',
    statusColor: '#44cc44',
  },
]

// ── 洄游路径（基于真实研究数据简化） ─────────────────────────────────
export const MIGRATION_PATHS: MigrationPath[] = [
  {
    speciesId: 'atlantic-bluefin',
    speciesName: '大西洋蓝鳍金枪鱼',
    scientificName: 'Thunnus thynnus',
    color: '#E84545',
    routeName: '北大西洋洄游',
    waypoints: [
      { lon: -80, lat: 25 },   // 墨西哥湾（冬/繁殖）
      { lon: -60, lat: 30 },
      { lon: -40, lat: 40 },
      { lon: -20, lat: 50 },   // 挪威海（夏/觅食）
      { lon: 0, lat: 45 },
      { lon: 10, lat: 40 },    // 地中海（重要产卵场）
      { lon: 20, lat: 35 },
      { lon: -30, lat: 30 },   // 返程
      { lon: -60, lat: 28 },
      { lon: -80, lat: 25 },
    ],
    seasonLabels: ['冬·繁殖', '春·北迁', '夏·觅食', '秋·南迁', '返程', '返程'],
  },
  {
    speciesId: 'pacific-bluefin',
    speciesName: '太平洋蓝鳍金枪鱼',
    scientificName: 'Thunnus orientalis',
    color: '#FF6B6B',
    routeName: '太平洋东西岸洄游',
    waypoints: [
      { lon: 140, lat: 30 },   // 日本海（产卵/养殖区）
      { lon: 155, lat: 35 },
      { lon: 175, lat: 38 },
      { lon: -160, lat: 40 },  // 阿拉斯加湾（夏/觅食）
      { lon: -140, lat: 35 },
      { lon: -130, lat: 30 },  // 加州海域（冬/繁殖）
      { lon: -120, lat: 25 },
      { lon: 130, lat: 25 },   // 返程
      { lon: 135, lat: 28 },
      { lon: 140, lat: 30 },
    ],
  },
  {
    speciesId: 'southern-bluefin',
    speciesName: '南方蓝鳍金枪鱼',
    scientificName: 'Thunnus maccoyii',
    color: '#FFA500',
    routeName: '南半球环南极洄游',
    waypoints: [
      { lon: 130, lat: -30 },  // 澳大利亚南部（繁殖）
      { lon: 110, lat: -40 },
      { lon: 80, lat: -45 },  // 印度洋南部（夏/觅食）
      { lon: 30, lat: -48 },
      { lon: -10, lat: -45 }, // 南大西洋
      { lon: -60, lat: -42 },
      { lon: -90, lat: -45 }, // 南太平洋
      { lon: -140, lat: -42 },
      { lon: -170, lat: -38 },
      { lon: 170, lat: -35 }, // 返回澳新
      { lon: 150, lat: -32 },
      { lon: 130, lat: -30 },
    ],
  },
  {
    speciesId: 'yellowfin',
    speciesName: '黄鳍金枪鱼',
    scientificName: 'Thunnus albacares',
    color: '#FFD700',
    routeName: '热带太平洋东西游',
    waypoints: [
      { lon: 130, lat: 5 },   // 西太平洋
      { lon: 145, lat: 8 },
      { lon: 160, lat: 5 },
      { lon: -170, lat: 3 },
      { lon: -140, lat: 5 },  // 东太平洋
      { lon: -120, lat: 8 },
      { lon: -100, lat: 5 },
      { lon: -85, lat: 3 },
      { lon: -80, lat: 5 },
      { lon: 130, lat: 5 },
    ],
  },
  {
    speciesId: 'bigeye',
    speciesName: '大眼金枪鱼',
    scientificName: 'Thunnus obesus',
    color: '#9B59B6',
    routeName: '热带深海垂直迁移',
    waypoints: [
      { lon: 145, lat: 0 },
      { lon: 160, lat: -5 },
      { lon: -170, lat: -3 },
      { lon: -140, lat: 2 },
      { lon: -110, lat: 0 },
      { lon: -90, lat: 3 },
      { lon: -80, lat: 0 },
      { lon: -70, lat: 3 },
      { lon: 0, lat: 2 },     // 大西洋
      { lon: 40, lat: 0 },
      { lon: 80, lat: 3 },
      { lon: 120, lat: 2 },
      { lon: 145, lat: 0 },
    ],
  },
  {
    speciesId: 'albacore',
    speciesName: '长鳍金枪鱼',
    scientificName: 'Thunnus alalunga',
    color: '#00D4FF',
    routeName: '北大西洋长距离迁移',
    waypoints: [
      { lon: -50, lat: 20 },  // 冬季越冬区
      { lon: -40, lat: 30 },
      { lon: -30, lat: 40 },
      { lon: -20, lat: 50 }, // 夏季觅食区（北欧海域）
      { lon: -10, lat: 55 },
      { lon: 0, lat: 50 },
      { lon: 10, lat: 45 },
      { lon: 20, lat: 40 },
      { lon: 10, lat: 35 },  // 地中海
      { lon: 0, lat: 30 },
      { lon: -20, lat: 25 },
      { lon: -40, lat: 22 },
      { lon: -50, lat: 20 },
    ],
  },
  {
    speciesId: 'skipjack',
    speciesName: '鲣鱼',
    scientificName: 'Katsuwonus pelamis',
    color: '#00FF88',
    routeName: '热带表层群游',
    waypoints: [
      { lon: 130, lat: 10 },
      { lon: 145, lat: 5 },
      { lon: 160, lat: 8 },
      { lon: -170, lat: 5 },
      { lon: -150, lat: 3 },
      { lon: -130, lat: 8 },
      { lon: -110, lat: 5 },
      { lon: -95, lat: 10 },
      { lon: 140, lat: 10 },
    ],
  },
]
