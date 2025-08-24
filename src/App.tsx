import React, { useMemo, useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ScrollControls, useScroll, Text, Stars } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette } from "@react-three/postprocessing";
import { motion, AnimatePresence } from "framer-motion";

/**
 * IZ HAIR TREND — single-file React landing with 3D depth, parallax, and scroll interactions.
 * - Dark futuristic aesthetic with gradients, glow, and glassmorphism
 * - Center outline title that assembles from "shards" on load, then gently floats
 * - Abstract 3D forms that rotate with mouse and flip on scroll
 * - RU/EN language toggle with CTA
 * - Footer with domain + support email + Instagram link
 *
 * Notes:
 * - To swap in a real SVG/PNG logo later, set `logoUrl` below.
 * - All styling uses Tailwind classes (no external CSS needed).
 */

const logoUrl: string | null = null; // e.g., "/logo.svg" once you export the provided PDF as SVG/PNG

type Lang = "ru" | "en";

const i18n: Record<Lang, any> = {
  ru: {
    hero: {
      title: "Irina Zilina hair trend",
      cta: "Запустить свою систему",
      sub: "Новый формат hairstyling-системы: глубина, 3D и скорость как в будущем.",
    },
    sections: {
      aboutTitle: "О продукте",
      about: "IZ HAIR TREND — это система визуализации и управления укладками: демонстрация образов в 3D, интеграция с Instagram-портфолио и быстрые сценарии записи.",
      feats: [
        {
          t: "3D‑глубина",
          d: "Интерактивные абстракции реагируют на мышь и скролл, создавая эффект присутствия.",
        },
        {
          t: "Виральный вау‑эффект",
          d: "Загрузка с эффектом сборки из осколков и мягким парением логотипа/титула.",
        },
        {
          t: "Контент‑фокус",
          d: "Акцент на работах: шутинг для невест, звёзды, обучение, аренда тресов.",
        },
      ],
      actionTitle: "Готовы попробовать?",
      actionText: "Запустите систему и свяжитесь для настройки под ваш салон и обучение команды.",
    },
    footer: {
      domain: "izhairtrend.shop",
      email: "support@izhairtrend.shop",
      insta: "Instagram портфолио",
    },
  },
  en: {
    hero: {
      title: "Irina Zilina hair trend",
      cta: "Launch Your System",
      sub: "A next‑gen hairstyling system: depth, realtime 3D and a futuristic feel.",
    },
    sections: {
      aboutTitle: "About the product",
      about: "IZ HAIR TREND is a system for showcasing and managing hairstyles: immersive 3D displays, Instagram portfolio integration, and fast booking flows.",
      feats: [
        { t: "3D depth", d: "Interactive abstractions react to mouse and scroll for presence and motion." },
        { t: "Viral wow", d: "Shard‑assembly on load, then a subtle floating logo/title." },
        { t: "Content first", d: "Spotlight on bridal looks, celebrity jobs, education and hair‑pieces rental." },
      ],
      actionTitle: "Ready to start?",
      actionText: "Launch the system and reach out for salon‑level setup and team onboarding.",
    },
    footer: {
      domain: "izhairtrend.shop",
      email: "support@izhairtrend.shop",
      insta: "Instagram portfolio",
    },
  },
};

function useWindowSize() {
  const [size, set] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const on = () => set({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return size;
}

function Shards({ count = 1200, duration = 2.6 }) {
  // Flying triangles that rush in and "assemble" the scene
  const ref = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const phases = useMemo(() => new Float32Array(count).map(() => Math.random()), [count]);
  const seeds = useMemo(() => new Array(count).fill(0).map(() => new THREE.Vector3(
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 28,
    (Math.random() - 0.5) * 30
  )), [count]);
  const targets = useMemo(() => new Array(count).fill(0).map(() => new THREE.Vector3(
    (Math.random() - 0.5) * 16,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 4
  )), [count]);
  const start = useRef<number>(0);
  useEffect(() => { start.current = performance.now(); }, []);

  useFrame(() => {
    const t = (performance.now() - start.current) / 1000;
    for (let i = 0; i < count; i++) {
      const p = Math.min(1, Math.max(0, (t - phases[i] * 0.6) / duration));
      const pos = seeds[i].clone().lerp(targets[i], easeOutCubic(p));
      const scale = Math.max(0.1, 1 - p * 0.9);
      dummy.position.copy(pos);
      dummy.rotation.set(
        (pos.x + t * 0.6) * 0.15,
        (pos.y - t * 0.4) * 0.2,
        (pos.z + t * 0.2) * 0.25
      );
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
      const c = new THREE.Color().setHSL(0.65 + 0.2 * (1 - p), 0.75, 0.6);
      // @ts-ignore - instance colors exist at runtime
      ref.current.setColorAt(i, c);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    // @ts-ignore - instanceColor exists at runtime
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined as any, undefined as any, count]}>
      <tetrahedronGeometry args={[0.22]} />
      <meshStandardMaterial metalness={0.4} roughness={0.2} emissiveIntensity={0.35} />
    </instancedMesh>
  );
}

function Abstracts() {
  const group = useRef<THREE.Group>(null!);
  useWindowSize(); // keep responsive feel
  useFrame((state) => {
    const x = (state.pointer.x || 0) * 0.4;
    const y = (state.pointer.y || 0) * 0.2;
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, y, 0.03);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, x, 0.03);
  });
  const N = 12;
  const items = useMemo(() => new Array(N).fill(0).map((_, i) => ({
    key: i,
    pos: new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6),
    rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
    scale: 0.6 + Math.random() * 2.4,
    type: i % 3,
  })), []);
  return (
    <group ref={group}>
      {items.map(({ key, pos, rot, scale, type }) => (
        <Float key={key} speed={1.2} rotationIntensity={0.5} floatIntensity={1.2}>
          <mesh position={pos} rotation={rot} scale={scale}>
            {type === 0 ? <icosahedronGeometry args={[0.6, 1]} /> : type === 1 ? <torusKnotGeometry args={[0.35, 0.12, 120, 16]} /> : <octahedronGeometry args={[0.7, 0]} />}
            <meshPhysicalMaterial transmission={0.9} thickness={1.2} roughness={0} metalness={0.1} clearcoat={1} color={new THREE.Color("#7dd3fc")} emissive={new THREE.Color("#2563eb")} emissiveIntensity={0.2} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function FlipOnScroll() {
  const ref = useRef<THREE.Group>(null!);
  const data = useScroll();
  useFrame(() => {
    const s = data.offset; // 0..1 current scroll offset
    const flip = Math.sin(s * Math.PI * 2);
    ref.current.rotation.y = flip * Math.PI;
    ref.current.position.z = -2 + s * 2;
  });
  return (
    <group ref={ref}>
      <mesh position={[3, -1.2, 0]} scale={1.8}>
        <dodecahedronGeometry args={[0.9]} />
        <meshStandardMaterial color={new THREE.Color("#a78bfa")} metalness={0.6} roughness={0.25} emissive={new THREE.Color("#6d28d9")} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[-3, 1.2, 0]} scale={1.2}>
        <torusGeometry args={[0.8, 0.2, 16, 100]} />
        <meshStandardMaterial color={new THREE.Color("#f0abfc")} metalness={0.5} roughness={0.3} emissive={new THREE.Color("#a21caf")} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

function HeroTitle({ lang }: { lang: Lang }) {
  const t = i18n[lang].hero.title;
  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.6}>
      <Text
        fontSize={1.5}
        anchorX="center"
        anchorY="middle"
        maxWidth={12}
        lineHeight={1}
        letterSpacing={0.02}
        outlineWidth={0.025}
        outlineColor="#93c5fd"
        outlineOpacity={1}
        color="#0ea5e9"
        fillOpacity={0.0}
      >
        {t.toUpperCase()}
      </Text>
    </Float>
  );
}

function Scene({ lang }: { lang: Lang }) {
  return (
    <>
      <Stars radius={80} depth={40} count={1200} factor={4} fade />
      <ambientLight intensity={0.4} />
      <directionalLight intensity={1.2} position={[4, 6, 6]} />
      <Environment preset="city" />

      <Shards />
      <Abstracts />
      <FlipOnScroll />
      <HeroTitle lang={lang} />

      <EffectComposer>
        <Bloom intensity={1.1} luminanceThreshold={0.2} luminanceSmoothing={0.4} />
        <DepthOfField focusDistance={0.005} focalLength={0.02} bokehScale={2} />
        <Noise opacity={0.03} />
        <Vignette eskil={false} offset={0.15} darkness={0.8} />
      </EffectComposer>
    </>
  );
}

function LanguageSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl px-3 py-2 flex gap-2 shadow-lg">
      {(["ru", "en"] as Lang[]).map((L) => (
        <button
          key={L}
          onClick={() => setLang(L)}
          className={`text-sm font-medium tracking-wide px-2 py-1 rounded-lg transition ${
            lang === L ? "bg-white/10 text-white" : "text-white/70 hover:text-white"
          }`}
        >
          {L.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function PrimaryButton({ children, onClick, className = "" }: any) {
  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center px-6 py-3 rounded-2xl overflow-hidden font-semibold tracking-wide transition hover:scale-[1.02] active:scale-95 ${className}`}
      style={{
        background:
          "radial-gradient(120% 120% at 50% 0%, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0.18) 40%, rgba(59,130,246,0.08) 100%)",
      }}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-cyan-500/40 to-fuchsia-500/40 opacity-40 blur-xl" />
      <span className="absolute inset-0 border border-white/15 rounded-2xl" />
      <span className="relative text-white">
        {children}
      </span>
    </button>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>("ru");
  const copy = i18n[lang];

  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    const n = navigator?.language?.toLowerCase?.() || "";
    if (n.startsWith("en")) setLang("en");
    if (n.startsWith("ru")) setLang("ru");
  }, []);

  return (
    <div className="min-h-screen w-full text-white selection:bg-cyan-500/40">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
        <div className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[120vmax] h-[120vmax] rounded-full opacity-30 blur-3xl"
             style={{ background: "radial-gradient(circle at 50% 50%, #0ea5e9 0%, transparent 60%)" }} />
        <div className="absolute top-1/2 right-0 w-[60vmax] h-[60vmax] rounded-full opacity-20 blur-3xl"
             style={{ background: "radial-gradient(circle at 50% 50%, #a855f7 0%, transparent 60%)" }} />
      </div>

      <LanguageSwitcher lang={lang} setLang={setLang} />

      <div className="fixed inset-0 -z-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <color attach="background" args={["#020617"]} />
          <ScrollControls pages={3}>
            <Suspense fallback={null}>
              <Scene lang={lang} />
            </Suspense>
          </ScrollControls>
        </Canvas>
      </div>

      <main className="relative z-10 flex flex-col items-center">
        <section className="w-full flex flex-col items-center justify-center text-center pt-32 pb-24 gap-8">
          {logoUrl ? (
            <img src={logoUrl} alt="IZ Hair Trend logo" className="w-40 h-auto opacity-80" />
          ) : null}

          <div className="max-w-3xl px-6">
            <p className="text-white/70 text-base md:text-lg">{copy.hero.sub}</p>
          </div>

          <PrimaryButton onClick={() => setLaunched(true)}>
            {copy.hero.cta}
          </PrimaryButton>

          <AnimatePresence>
            {launched && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl"
              >
                <span className="text-sm text-white/80">
                  {lang === "ru"
                    ? "Система запущена — прокрутите вниз, чтобы увидеть детали и подключиться."
                    : "System launched — scroll to explore details and connect."}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="relative w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-24">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
              {copy.sections.aboutTitle}
            </h2>
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 leading-relaxed text-white/90">
              {copy.sections.about}
            </div>
          </div>
          {copy.sections.feats.map((f: any, i: number) => (
            <div key={i} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
              <h3 className="text-xl font-medium mb-2">{f.t}</h3>
              <p className="text-white/80">{f.d}</p>
            </div>
          ))}
        </section>

        <section className="w-full max-w-4xl text-center px-6 pb-28">
          <h3 className="text-2xl md:text-3xl font-semibold mb-4">{copy.sections.actionTitle}</h3>
          <p className="text-white/80 mb-6">{copy.sections.actionText}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton onClick={() => (window.location.href = "mailto:" + i18n[lang].footer.email)}>
              {lang === "ru" ? "Связаться" : "Contact"}
            </PrimaryButton>
            <a href="https://www.instagram.com/irinazilina.hairtrend" target="_blank" rel="noreferrer"
               className="px-6 py-3 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl text-white/90 hover:text-white transition">
              {i18n[lang].footer.insta}
            </a>
          </div>
        </section>
      </main>

      <footer className="relative z-10 w-full px-6 pb-12">
        <div className="max-w-6xl mx-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white/80">
            <div className="font-semibold">{i18n[lang].footer.domain}</div>
            <div className="text-sm">{i18n[lang].footer.email}</div>
          </div>
          <div className="text-sm text-white/60">
            © {new Date().getFullYear()} IZ HAIR TREND · Klaipėda · All rights reserved
          </div>
        </div>
      </footer>
    </div>
  );
}
