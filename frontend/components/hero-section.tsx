"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { AdditiveBlending, Color, type Mesh, type Group, BufferGeometry, Float32BufferAttribute } from "three"
import { useMemo, useRef } from "react"
import styles from "./hero-section.module.css"

function SpinningKnot() {
  const ref = useRef<Mesh>(null)
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.x += delta * 0.25
    ref.current.rotation.y += delta * 0.35
  })
  return (
    <mesh ref={ref} scale={1.35}>
      <torusKnotGeometry args={[1, 0.25, 180, 24]} />
      <meshBasicMaterial color={"#56FF0A"} wireframe transparent opacity={0.6} />
    </mesh>
  )
}

function StarField({ count = 800 }: { count?: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 3 + Math.random() * 2.5
      const theta = Math.acos(2 * Math.random() - 1)
      const phi = Math.random() * Math.PI * 2
      arr[i * 3 + 0] = r * Math.sin(theta) * Math.cos(phi)
      arr[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi)
      arr[i * 3 + 2] = r * Math.cos(theta)
    }
    return arr
  }, [count])

  // Cria a geometria uma única vez com o atributo "position"
  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute("position", new Float32BufferAttribute(positions, 3))
    return g
  }, [positions])

  const group = useRef<Group>(null)
  useFrame((_, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * 0.04
    group.current.rotation.x += delta * 0.01
  })

  return (
    <group ref={group}>
      <points geometry={geometry}>
        <pointsMaterial
          color={new Color("#56FF0A")}
          size={0.02}
          sizeAttenuation
          transparent
          opacity={0.45}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  )
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
      {/* Animated background layers */}
      <div className={styles.aurora} aria-hidden="true">
        <div className={`${styles.blob} ${styles.blobOne}`} />
        <div className={`${styles.blob} ${styles.blobTwo}`} />
        <div className={`${styles.blob} ${styles.blobThree}`} />
        <div className={styles.gridOverlay} />
        <div className={styles.scanlines} />
        <div className={styles.noise} />
      </div>

      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 4.2], fov: 55 }} gl={{ antialias: true, alpha: true }}>
          {/* No lights needed for meshBasicMaterial; scene is minimalist */}
          <SpinningKnot />
          <StarField />
        </Canvas>
      </div>

      {/* Title only */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10 sm:py-12 md:py-14 text-center">
        <h1 className={`${styles.titleGlow} text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight`}>
          <span className="text-[#56FF0A]">{"GeoGuessr Live Viewer"}</span>
        </h1>
      </div>
    </section>
  )
}
