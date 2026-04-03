// Globe.tsx — 纯 Three.js 3D 地球 + 金枪鱼洄游动画
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { MigrationPath } from '../types/tuna'

const EARTH_R = 20

// ── 经纬度 → 三维坐标 ────────────────────────────────────────────────
function latLonToVec3(lat: number, lon: number, r = EARTH_R): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

// ── 金枪鱼精灵纹理 ───────────────────────────────────────────────────
function makeTunaTexture(color: string): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = 128; cv.height = 80
  const ctx = cv.getContext('2d')!
  ctx.clearRect(0, 0, 128, 80)

  // 发光光晕
  const glow = ctx.createRadialGradient(64, 40, 0, 64, 40, 50)
  glow.addColorStop(0, color + 'aa')
  glow.addColorStop(0.4, color + '44')
  glow.addColorStop(1, color + '00')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 128, 80)

  // 身体
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(58, 40, 38, 15, 0, 0, Math.PI * 2)
  ctx.fill()

  // 尾鳍
  ctx.beginPath()
  ctx.moveTo(96, 40)
  ctx.lineTo(112, 28)
  ctx.lineTo(112, 52)
  ctx.closePath()
  ctx.fill()

  // 背鳍
  ctx.beginPath()
  ctx.moveTo(44, 25)
  ctx.lineTo(52, 12)
  ctx.lineTo(60, 25)
  ctx.closePath()
  ctx.fill()

  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.beginPath()
  ctx.ellipse(38, 34, 12, 6, -0.3, 0, Math.PI * 2)
  ctx.fill()

  // 眼睛
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.beginPath(); ctx.arc(28, 38, 5, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.beginPath(); ctx.arc(27, 37, 2, 0, Math.PI * 2); ctx.fill()

  return new THREE.CanvasTexture(cv)
}

// ── Props ───────────────────────────────────────────────────────────────────
interface Props {
  paths: MigrationPath[]
  activeSpecies: string[]
}

export default function Globe({ paths, activeSpecies }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

  // ── 初始化 Three.js（只执行一次）───────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return
    const container = mountRef.current
    const W = container.clientWidth || 800
    const H = container.clientHeight || 600

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x010c1a, 1)
    container.appendChild(renderer.domElement)

    // Scene
    const scene = new THREE.Scene()

    // Camera
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 2000)
    camera.position.set(0, 15, 65)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.minDistance = EARTH_R + 3
    controls.maxDistance = 150
    camera.lookAt(0, 0, 0)

    // Lights
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

    // Earth texture loader
    const loader = new THREE.TextureLoader()

    // Earth sphere
    const earthGroup = new THREE.Group()
    scene.add(earthGroup)

    const earthMesh = new THREE.Mesh(
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
    )
    earthGroup.add(earthMesh)

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

    // ── 存储洄游路径线和金枪鱼精灵 ────────────────────────────
    const pathLines: THREE.Line[] = []
    const tunaSprites: THREE.Sprite[] = []
    const tunaCurves: THREE.CatmullRomCurve3[] = []
    const tunaProgress: number[] = []
    const tunaSpeed: number[] = []

    // ── 更新路径和金枪鱼 ────────────────────────────────────────
    function updatePaths() {
      // 清除旧路径线
      pathLines.forEach(l => scene.remove(l))
      pathLines.length = 0

      // 清除旧精灵
      tunaSprites.forEach(s => scene.remove(s))
      tunaSprites.length = 0
      tunaCurves.length = 0
      tunaProgress.length = 0
      tunaSpeed.length = 0

      const activePaths = paths.filter(p => activeSpecies.includes(p.speciesId))

      activePaths.forEach(path => {
        if (path.waypoints.length < 2) return

        // ── 绘制路径线 ───────────────────────────────────────
        const pts = path.waypoints.map(w => latLonToVec3(w.lat, w.lon, EARTH_R + 0.3))
        const curve = new THREE.CatmullRomCurve3(pts, true)
        const curvePoints = curve.getPoints(200)

        const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints)
        const lineMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(path.color),
          transparent: true,
          opacity: 0.75,
        })
        const line = new THREE.Line(lineGeo, lineMat)
        scene.add(line)
        pathLines.push(line)

        // ── 添加金枪鱼精灵 ───────────────────────────────────
        const colorStr = new THREE.Color(path.color).getStyle()
        const tex = makeTunaTexture(colorStr)
        const mat = new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          opacity: 1.0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
        const sprite = new THREE.Sprite(mat)
        sprite.scale.set(4, 2.5, 1)
        sprite.visible = false
        scene.add(sprite)
        tunaSprites.push(sprite)
        tunaCurves.push(curve)
        tunaProgress.push(Math.random()) // 随机起始位置
        tunaSpeed.push(0.12 + Math.random() * 0.08) // 12~20%/秒
      })
    }

    updatePaths()

    // ── 动画循环 ─────────────────────────────────────────────────
    let lastTime = performance.now()
    const animate = () => {
      requestAnimationFrame(animate)

      const now = performance.now()
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      controls.update()

      // 更新每条鱼的位置
      for (let i = 0; i < tunaSprites.length; i++) {
        tunaProgress[i] = (tunaProgress[i] + tunaSpeed[i] * dt) % 1
        const t = tunaProgress[i]
        const pos = tunaCurves[i].getPoint(t)
        tunaSprites[i].position.copy(pos)
        tunaSprites[i].visible = true

        // 朝向：沿曲线切线方向
        const ahead = tunaCurves[i].getPoint((t + 0.01) % 1)
        tunaSprites[i].lookAt(ahead)
      }

      renderer.render(scene, camera)
    }
    requestAnimationFrame(animate)

    // ── 响应窗口大小变化 ─────────────────────────────────────────
    const onResize = () => {
      if (!mountRef.current) return
      const w = mountRef.current.clientWidth
      const h = mountRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // ── 暴露 updatePaths 供外部调用 ─────────────────────────────
    ;(container as any).__updatePaths = updatePaths

    // 清理
    return () => {
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── activeSpecies 变化时重新更新路径 ─────────────────────────
  useEffect(() => {
    if (mountRef.current && (mountRef.current as any).__updatePaths) {
      (mountRef.current as any).__updatePaths()
    }
  }, [paths, activeSpecies])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', cursor: 'grab' }}
    />
  )
}
