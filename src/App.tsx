// App.tsx — 金枪鱼保护网站
import { useState } from 'react'
import Globe from './components/Globe'
import { TUNA_SPECIES, MIGRATION_PATHS } from './types/tuna'
import './index.css'

export default function App() {
  const [activeSpecies, setActiveSpecies] = useState<string[]>(TUNA_SPECIES.map(s => s.id))

  const toggleSpecies = (id: string) => {
    setActiveSpecies(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="app">
      {/* ── 顶部导航 ──────────────────────────────────────── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🐟</span>
            <span className="logo-text">TunaGuard</span>
            <span className="logo-sub">金枪鱼保护追踪</span>
          </div>
          <nav className="nav">
            <a href="#" className="nav-link active">实时追踪</a>
            <a href="#" className="nav-link">保护地图</a>
            <a href="#" className="nav-link">物种指南</a>
            <a href="#" className="nav-link">关于我们</a>
          </nav>
        </div>
      </header>

      <div className="main-layout">
        {/* ── 左侧物种选择栏 ───────────────────────────────── */}
        <aside className="sidebar">
          <div className="sidebar-title">
            <span>🐠</span> 物种筛选
          </div>
          <div className="species-list">
            {TUNA_SPECIES.map(species => (
              <label key={species.id} className="species-item">
                <input
                  type="checkbox"
                  checked={activeSpecies.includes(species.id)}
                  onChange={() => toggleSpecies(species.id)}
                />
                <span
                  className="species-dot"
                  style={{ background: species.color }}
                />
                <div className="species-info">
                  <div className="species-name">{species.name}</div>
                  <div className="species-sci">{species.scientificName}</div>
                </div>
                <span
                  className="species-status"
                  style={{ color: species.statusColor, borderColor: species.statusColor }}
                >
                  {species.status}
                </span>
              </label>
            ))}
          </div>

          <div className="sidebar-divider" />
          <div className="sidebar-title"><span>📊</span> 图例</div>
          <div className="legend">
            <div className="legend-row">
              <div className="legend-line" style={{ background: 'linear-gradient(90deg, #E84545, #FF8888)' }} />
              <span>洄游路径</span>
            </div>
            <div className="legend-row">
              <div className="legend-tuna">
                <svg viewBox="0 0 40 24" style={{ width: 24, height: 14 }}>
                  <ellipse cx="20" cy="12" rx="14" ry="6" fill="#00D4FF" />
                  <polygon points="34,12 40,7 40,17" fill="#00D4FF" />
                </svg>
              </div>
              <span>移动金枪鱼</span>
            </div>
            <div className="legend-row">
              <span className="status-dot" style={{ background: '#ff4444' }} />
              <span>EN 濒危</span>
            </div>
            <div className="legend-row">
              <span className="status-dot" style={{ background: '#ff9944' }} />
              <span>VU 易危</span>
            </div>
            <div className="legend-row">
              <span className="status-dot" style={{ background: '#aacc00' }} />
              <span>NT 近危</span>
            </div>
            <div className="legend-row">
              <span className="status-dot" style={{ background: '#44cc44' }} />
              <span>LC 无危</span>
            </div>
          </div>

          <div className="sidebar-divider" />
          <div className="sidebar-tip">
            💡 选中物种后，<br />洄游路径将显示在地图上
          </div>
        </aside>

        {/* ── 地图区域 ────────────────────────────────────── */}
        <div className="globe-container">
          <Globe
            paths={MIGRATION_PATHS}
            activeSpecies={activeSpecies}
          />

          {/* 地图覆盖信息 */}
          <div className="map-overlay-top">
            <div className="stats-bar">
              <div className="stat-item">
                <div className="stat-value">{activeSpecies.length}</div>
                <div className="stat-label">追踪物种</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: '#E84545' }}>
                  {TUNA_SPECIES.filter(s => activeSpecies.includes(s.id) && s.status.startsWith('EN')).length}
                </div>
                <div className="stat-label">濒危物种</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: '#FFD700' }}>
                  {MIGRATION_PATHS.filter(p => activeSpecies.includes(p.speciesId)).reduce((sum, p) => sum + p.waypoints.length, 0)}
                </div>
                <div className="stat-label">洄游节点</div>
              </div>
            </div>
          </div>

          {/* 右下角提示 */}
          <div className="map-hint">
            🖱️ 拖动旋转地球 · 滚轮缩放
          </div>
        </div>
      </div>
    </div>
  )
}
