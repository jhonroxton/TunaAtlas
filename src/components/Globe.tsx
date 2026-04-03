// Globe.tsx — Three.js 3D 地球 + 金枪鱼洄游动画
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { MigrationPath } from '../types/tuna'

const EARTH_R = 20

// ── 坐标转换 ────────────────────────────────────────────────────────────────
function latLonToVec3(lat: number, lon: number, r = EARTH_R): THREE.Vector3 {
  const phi = (90 - lat) * Math.PI / 180
  const theta = (lon + 180) * Math.PI / 180
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

// ── 金枪鱼 Canvas 纹理 ──────────────────────────────────────────────────
function makeTunaTex(color: string): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = 96; cv.height = 64
  const ctx = cv.getContext('2d')!
  ctx.clearRect(0, 0, 96, 64)

  // 外发光
  const glow = ctx.createRadialGradient(48, 32, 0, 48, 32, 36)
  glow.addColorStop(0, color + 'cc')
  glow.addColorStop(0.5, color + '44')
  glow.addColorStop(1, color + '00')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 96, 64)

  // 身体
  ctx.fillStyle = color
  ctx.beginPath(); ctx.ellipse(44, 32, 28, 12, 0, 0, Math.PI * 2); ctx.fill()
  // 尾鳍
  ctx.beginPath(); ctx.moveTo(72, 32); ctx.lineTo(84, 22); ctx.lineTo(84, 42); ctx.closePath(); ctx.fill()
  // 背鳍
  ctx.beginPath(); ctx.moveTo(34, 20); ctx.lineTo(40, 10); ctx.lineTo(46, 20); ctx.closePath(); ctx.fill()
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.beginPath(); ctx.ellipse(30, 28, 10, 5, -0.3, 0, Math.PI * 2); ctx.fill()
  // 眼
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.arc(22, 30, 4, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(21, 29, 1.5, 0, Math.PI * 2); ctx.fill()

  return new THREE.CanvasTexture(cv)
}

// ── 金枪鱼动画状态 ─────────────────────────────────────────────────────
interface TunaAnim {
  progress: number
  speed: number
  sprite: THREE.Sprite
  curve: THREE.CatmullRomCurve3
}

// ── Props ───────────────────────────────────────────────────────────────────
interface GlobeProps {
  paths: MigrationPath[]
  activeSpecies: string[]
}

// ── 组件 ───────────────────────────────────────────────────────────────────
export default function Globe({ paths, activeSpecies }: GlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    pathLines: Map<string, THREE.Line>
    tunaAnims: TunaAnim[]
    rafId: number
  } | null>(null)

  // ── 初始化 Three.js ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return
    const container = mountRef.current
    const W = container.clientWidth || 800, H = container.clientHeight || 600

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x010c1a, 1)
    container.appendChild(renderer.domElement)

    // Scene
    const scene = new THREE.Scene()
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const sun = new THREE.PointLight(0xffffff, 1.4)
    sun.position.set(50, 30, 50)
    scene.add(sun)

    // Stars
    const starGeo = new THREE.BufferGeometry()
    const starPos = new Float32Array(4000 * 3)
    for (let i = 0; i < 4000 * 3; i++) starPos[i] = (Math.random() - 0.5) * 600
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, sizeAttenuation: true })))

    // Earth
    const loader = new THREE.TextureLoader()
    const earthGroup = new THREE.Group()
    scene.add(earthGroup)

    earthGroup.add(new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_R, 64, 64),
      new THREE.MeshPhongMaterial({
        color: 0x1a4a7a,
        map: loader.load('/textures/earth-blue-marble.jpg'),
        bumpMap: loader.load('/textures/earth-topology.png'),
        bumpScale: 0.04,
        specularMap: loader.load('/textures/earth-water.png'),
        specular: new THREE.Color(0x1a3355),
        shininess: 8,
      })
    ))

    // Atmosphere glow
    earthGroup.add(new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_R + 1.2, 64, 64),
      new THREE.MeshPhongMaterial({
        color: 0x0066bb,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
        depthWrite: false,
      })
    ))

    // Camera
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 2000)
    camera.position.set(0, 15, 65)
    camera.lookAt(0, 0, 0)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.minDistance = EARTH_R + 3
    controls.maxDistance = 150

    stateRef.current = {
      renderer, scene, camera, controls,
      pathLines: new Map(),
      tunaAnims: [],
      rafId: 0,
    }

    // Animation loop
    let lastTime = 0
    const animate = (time: number) => {
      stateRef.current!.rafId = requestAnimationFrame(animate)
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0.016
      lastTime = time

      controls.update()

      // 更新每条鱼的动画
      const anims = stateRef.current!.tunaAnims
      for (const ta of anims) {
        ta.progress = (ta.progress + ta.speed * dt) % 1
        const pos = ta.curve.getPoint(ta.progress)
        ta.sprite.position.copy(pos)
        ta.sprite.visible = true
        const ahead = ta.curve.getPoint((ta.progress + 0.01) % 1)
        ta.sprite.lookAt(ahead)
      }

      renderer.render(scene, camera)
    }
    stateRef.current.rafId = requestAnimationFrame(animate)

    const onResize = () => {
      if (!mountRef.current) return
      const w = mountRef.current.clientWidth, h = mountRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(stateRef.current!.rafId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      container.removeChild(renderer.domElement)
      stateRef.current = null
    }
  }, [])

  // ── 构建/更新洄游路径线 ──────────────────────────────────────────────
  useEffect(() => {
    const ref = stateRef.current
    if (!ref) return
    const { scene } = ref

    ref.pathLines.forEach(line => scene.remove(line))
    ref.pathLines.clear()

    const activePaths = paths.filter(p => activeSpecies.includes(p.speciesId))
    activePaths.forEach(path => {
      const pts = path.waypoints.map(w => latLonToVec3(w.lat, w.lon, EARTH_R + 0.3))
      if (pts.length < 2) return

      // 用 CatmullRomCurve3 让路径更平滑
      const curve = new THREE.CatmullRomCurve3(pts, true)
      const pts200 = curve.getPoints(200)

      const geo = new THREE.BufferGeometry().setFromPoints(pts200)
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(path.color),
        transparent: true,
        opacity: 0.75,
      })
      const line = new THREE.Line(geo, mat)
      scene.add(line)
      ref.pathLines.set(path.speciesId, line)
    })
  }, [paths, activeSpecies])

  // ── 构建/更新金枪鱼精灵 ─────────────────────────────────────────────
  useEffect(() => {
    const ref = stateRef.current
    if (!ref) return
    const { scene } = ref

    // 移除旧精灵
    ref.tunaAnims.forEach(ta => scene.remove(ta.sprite))
    ref.tunaAnims = []

    const activePaths = paths.filter(p => activeSpecies.includes(p.speciesId))
    activePaths.forEach(path => {
      if (path.waypoints.length < 2) return

      const colorStr = new THREE.Color(path.color).getStyle()
      const tunaTex = makeTunaTex(colorStr)
      const mat = new THREE.SpriteMaterial({
        map: tunaTex,
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const sprite = new THREE.Sprite(mat)
      sprite.scale.set(3.5, 2.2, 1)
      sprite.visible = false
      scene.add(sprite)

      const pts = path.waypoints.map(w => latLonToVec3(w.lat, w.lon, EARTH_R + 0.5))
      const curve = new THREE.CatmullRomCurve3(pts, true)

      ref.tunaAnims.push({
        progress: Math.random(),
        speed: 0.15 + Math.random() * 0.1, // 15~25%/s — 更快更明显
        sprite,
        curve,
      })
    })
  }, [paths, activeSpecies])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', cursor: 'grab' }}
    />
  )
}
