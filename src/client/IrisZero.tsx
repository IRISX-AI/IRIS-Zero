import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import {
  Mic,
  Settings,
  Volume2,
  VolumeX,
  Activity,
  Cpu,
  Zap,
  Brain,
  CheckCircle2,
  Loader2,
  X,
  Circle,
  Square,
  Wifi,
  Terminal,
  Sparkles,
} from "lucide-react";
import * as THREE from "three";

// ─── Types ───────────────────────────────────────────────────────────

type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "ready";
type RecordingState = "idle" | "recording" | "processing" | "speaking";

interface SystemStatus {
  ollama: boolean;
  tts: boolean;
  modelName: string;
  cpuUsage: number;
  memoryUsage: number;
}

interface ExecutionTask {
  id: string;
  label: string;
  status: "pending" | "running" | "completed" | "error";
  progress?: number;
}

// ─── Utility Components ──────────────────────────────────────────────

const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  delay?: number;
}> = ({ children, className = "", glow = false, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.95 }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={`relative overflow-hidden backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] rounded-3xl ${glow ? "shadow-[0_0_60px_-15px_rgba(0,255,136,0.15)]" : "shadow-2xl shadow-black/40"} ${className}`}
  >
    {glow && (
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#00ff88]/5 via-transparent to-transparent pointer-events-none" />
    )}
    <div className="relative z-10">{children}</div>
  </motion.div>
);

// ─── 1. GlobeAI Component ─────────────────────────────────────────────

const NeuralSphere: React.FC<{ voiceState: VoiceState }> = ({ voiceState }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const particleCount = 200;
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    const radii = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.8 + Math.random() * 1.5;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      speeds[i] = 0.2 + Math.random() * 0.8;
      radii[i] = r;
    }
    return { positions, speeds, radii };
  }, []);

  const sphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uState: { value: 0 },
        uColor: { value: new THREE.Color("#00ff88") },
      },
      vertexShader: `
        varying vec3 vNormal; varying vec3 vPosition; uniform float uTime; uniform float uState;
        void main() {
          vNormal = normalize(normalMatrix * normal); vPosition = position; vec3 pos = position;
          float noise = sin(pos.x * 4.0 + uTime) * cos(pos.y * 4.0 + uTime) * sin(pos.z * 4.0 + uTime);
          float displacement = noise * 0.05 * (1.0 + uState * 0.5); pos += normal * displacement;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal; varying vec3 vPosition; uniform float uTime; uniform vec3 uColor; uniform float uState;
        void main() {
          float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          float pulse = 0.7 + 0.3 * sin(uTime * 2.0 + uState * 3.0);
          vec3 color = uColor * (0.2 + fresnel * 0.8) * pulse; float alpha = 0.3 + fresnel * 0.4;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, []);

  const stateValue = useMemo(() => {
    switch (voiceState) {
      case "idle":
        return 0;
      case "listening":
        return 1;
      case "thinking":
        return 2;
      case "speaking":
        return 3;
      case "ready":
        return 0.5;
      default:
        return 0;
    }
  }, [voiceState]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    sphereMaterial.uniforms.uTime.value = time;
    sphereMaterial.uniforms.uState.value = THREE.MathUtils.lerp(
      sphereMaterial.uniforms.uState.value,
      stateValue,
      0.05,
    );

    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.1;
      meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
      const targetScale =
        voiceState === "listening"
          ? 1.15
          : voiceState === "thinking"
            ? 1.05
            : 1.0;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.05,
      );
    }

    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const speed =
          particles.speeds[i] *
          (voiceState === "thinking"
            ? 3
            : voiceState === "listening"
              ? 1.5
              : 0.5);
        const angle = time * speed + i * 0.1;
        const r = particles.radii[i] + Math.sin(time * 0.5 + i) * 0.1;
        positions[i * 3] = r * Math.cos(angle) * Math.sin(i * 0.5);
        positions[i * 3 + 1] = r * Math.sin(angle) * Math.sin(i * 0.5);
        positions[i * 3 + 2] = r * Math.cos(i * 0.5);
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.rotation.y =
        time * 0.05 * (voiceState === "thinking" ? 2 : 1);
    }

    if (glowRef.current) {
      const glowScale =
        1.2 + Math.sin(time * 2) * 0.05 * (voiceState === "speaking" ? 2 : 1);
      glowRef.current.scale.setScalar(glowScale);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.1 + Math.sin(time * 1.5) * 0.05 * (voiceState === "speaking" ? 2 : 1);
    }

    if (groupRef.current)
      groupRef.current.position.y = Math.sin(time * 0.5) * 0.1;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} material={sphereMaterial}>
        <sphereGeometry args={[1.5, 64, 64]} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.15} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.7, 32, 32]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particles.positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#00ff88"
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#00ff88" />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#00cc6a" />
    </group>
  );
};

const GlobeAI: React.FC<{ voiceState: VoiceState }> = ({ voiceState }) => (
  <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
    <div className="w-[500px] h-[500px] -mt-16">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <NeuralSphere voiceState={voiceState} />
      </Canvas>
    </div>
  </div>
);

// ─── 2. Header Component ──────────────────────────────────────────────

const Header: React.FC<{ voiceState: VoiceState; onSettings: () => void }> = ({
  voiceState,
  onSettings,
}) => {
  const stateConfig = {
    idle: { label: "Ready", color: "text-white/60", icon: Circle },
    listening: { label: "Listening", color: "text-[#00ff88]", icon: Mic },
    thinking: { label: "Thinking", color: "text-[#00ff88]", icon: Brain },
    speaking: { label: "Speaking", color: "text-[#00ff88]", icon: Volume2 },
    ready: { label: "Ready", color: "text-white/60", icon: CheckCircle2 },
  };
  const config = stateConfig[voiceState];
  const StateIcon = config.icon;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-0 left-0 right-0 z-50 px-8 py-6 pointer-events-none"
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ff88]/20 to-transparent border border-[#00ff88]/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#00ff88]" />
            <div className="absolute inset-0 rounded-xl bg-[#00ff88]/10 blur-md" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-semibold text-lg tracking-tight">
              IRIS-ZERO
            </span>
            <span className="text-white/40 text-xs tracking-widest uppercase">
              Local AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
          <motion.div
            animate={
              voiceState === "listening" || voiceState === "speaking"
                ? { scale: [1, 1.2, 1] }
                : {}
            }
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <StateIcon className={`w-4 h-4 ${config.color}`} />
          </motion.div>
          <span className={`text-sm font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20">
            <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-[#00ff88] text-xs font-medium">Local</span>
          </div>
          <button
            onClick={onSettings}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105"
          >
            <Settings className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

// ─── 3. Left Panel Component (System Health & Transcription) ─────────

const LeftPanel: React.FC<{
  status: SystemStatus;
  transcript: string;
  isActive: boolean;
}> = ({ status, transcript, isActive }) => {
  const words = transcript.split(" ");
  return (
    <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-40 w-[320px]">
      <GlassCard delay={0.2}>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#00ff88]/60" />
            <span className="text-white/40 text-xs uppercase tracking-widest">
              System Health
            </span>
          </div>
          <div className="space-y-3">
            {[
              { label: "Ollama", active: status.ollama, icon: Brain },
              { label: "TTS", active: status.tts, icon: Volume2 },
            ].map((service) => (
              <div
                key={service.label}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <service.icon className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-white/70 text-sm">{service.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${service.active ? "bg-[#00ff88] animate-pulse" : "bg-red-500"}`}
                  />
                  <span
                    className={`text-xs ${service.active ? "text-[#00ff88]/80" : "text-red-400/80"}`}
                  >
                    {service.active ? "Active" : "Offline"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/40 text-xs">CPU</span>
              <span className="text-white/60 text-xs">{status.cpuUsage}%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#00ff88] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${status.cpuUsage}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <div className="flex items-center justify-between mb-2 mt-2">
              <span className="text-white/40 text-xs">Memory</span>
              <span className="text-white/60 text-xs">
                {status.memoryUsage}%
              </span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#00ff88]/70 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${status.memoryUsage}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        </div>
      </GlassCard>

      <AnimatePresence>
        {(transcript || isActive) && (
          <GlassCard glow={isActive} delay={0.3}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-4 h-4 text-[#00ff88]/60" />
                <span className="text-white/40 text-xs uppercase tracking-widest">
                  Transcription
                </span>
              </div>
              <div className="min-h-[4rem]">
                <p className="text-white/90 text-sm leading-relaxed font-light">
                  {words.map((word, i) => (
                    <motion.span
                      key={`${word}-${i}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="inline-block mr-1.5"
                    >
                      {word}
                    </motion.span>
                  ))}
                  {isActive && (
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-0.5 h-4 bg-[#00ff88] ml-1 align-middle"
                    />
                  )}
                </p>
              </div>
            </div>
          </GlassCard>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── 4. Right Panel Component (Execution Status) ─────────────────────

const RightPanel: React.FC<{ currentTask: string; modelName: string }> = ({
  currentTask,
  modelName,
}) => (
  <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-40 w-[280px]">
    <GlassCard delay={0.3}>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-[#00ff88]/60" />
          <span className="text-white/40 text-xs uppercase tracking-widest">
            Execution Status
          </span>
        </div>
        <div className="space-y-4">
          <div>
            <span className="text-white/40 text-xs block mb-1">
              Current Task
            </span>
            <span className="text-white/80 text-sm">
              {currentTask || "Idle"}
            </span>
          </div>
          <div>
            <span className="text-white/40 text-xs block mb-1">Model</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
              <span className="text-[#00ff88]/80 text-sm font-medium">
                {modelName}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center gap-2 text-white/40 text-xs">
              <Wifi className="w-3 h-3" />
              <span>Local inference active</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  </div>
);

// ─── 5. Dock Component (Bottom Voice Controls) ───────────────────────

const Dock: React.FC<{
  recordingState: RecordingState;
  isMuted: boolean;
  onMicToggle: () => void;
  onMuteToggle: () => void;
  onInterrupt: () => void;
  onHoldStart: () => void;
  onHoldEnd: () => void;
}> = ({
  recordingState,
  isMuted,
  onMicToggle,
  onMuteToggle,
  onInterrupt,
  onHoldStart,
  onHoldEnd,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  const isRecording = recordingState === "recording";
  const isProcessing = recordingState === "processing";

  useEffect(() => {
    if (buttonRef.current && isRecording)
      gsap.to(buttonRef.current, {
        scale: 1.1,
        duration: 0.8,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
      });
    else if (buttonRef.current) {
      gsap.killTweensOf(buttonRef.current);
      gsap.to(buttonRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }, [isRecording]);

  const handlePointerDown = () => {
    setIsPressed(true);
    onHoldStart();
  };
  const handlePointerUp = () => {
    if (isPressed) {
      setIsPressed(false);
      onHoldEnd();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6"
    >
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onMuteToggle}
          className={`p-3.5 rounded-2xl border transition-all duration-300 ${isMuted ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onInterrupt}
          className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all duration-300"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      <div className="relative flex flex-col items-center gap-6">
        {isRecording &&
          [1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border border-[#00ff88]/30 pointer-events-none"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeOut",
              }}
            />
          ))}
        <motion.button
          ref={buttonRef}
          onClick={onMicToggle}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${isRecording ? "bg-[#00ff88] shadow-[0_0_60px_rgba(0,255,136,0.4)]" : isProcessing ? "bg-white/10 border border-white/20" : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#00ff88]/30"}`}
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
          ) : isRecording ? (
            <Square className="w-8 h-8 text-[#050505] fill-current" />
          ) : (
            <Mic className="w-8 h-8 text-white/80" />
          )}
          <div
            className={`absolute inset-0 rounded-full transition-opacity duration-500 ${isRecording ? "opacity-100" : "opacity-0"} bg-gradient-to-br from-[#00ff88]/20 to-transparent blur-md`}
          />
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── 6. Main Application ─────────────────────────────────────────────

const IRISZero: React.FC = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [currentTask, setCurrentTask] = useState("");
  const [tasks, setTasks] = useState<ExecutionTask[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const [systemStatus] = useState<SystemStatus>({
    ollama: true,
    tts: true,
    modelName: "llama3.1:8b",
    cpuUsage: 24,
    memoryUsage: 42,
  });

  const simulateVoiceInteraction = useCallback(async () => {
    setVoiceState("listening");
    setRecordingState("recording");
    setTranscript("");
    setResponse("");
    setTasks([]);
    const words = "Create a Next.js project and install dependencies".split(
      " ",
    );
    for (let i = 0; i < words.length; i++) {
      await new Promise((r) => setTimeout(r, 200));
      setTranscript((prev) => prev + (prev ? " " : "") + words[i]);
    }
    setRecordingState("processing");
    setVoiceState("thinking");
    await new Promise((r) => setTimeout(r, 1500));
    setVoiceState("speaking");
    setRecordingState("speaking");
    setCurrentTask("Project initialization");
    const responseWords =
      "Creating project... Installing dependencies... Ready.".split(" ");
    for (let i = 0; i < responseWords.length; i++) {
      await new Promise((r) => setTimeout(r, 150));
      setResponse((prev) => prev + (prev ? " " : "") + responseWords[i]);
    }
    setTasks([
      {
        id: "1",
        label: "Initialize Next.js project",
        status: "completed",
        progress: 100,
      },
      {
        id: "2",
        label: "Install dependencies",
        status: "running",
        progress: 65,
      },
      { id: "3", label: "Configure Tailwind CSS", status: "pending" },
    ]);
    await new Promise((r) => setTimeout(r, 2000));
    setTasks((prev) =>
      prev.map((t) => ({ ...t, status: "completed" as const, progress: 100 })),
    );
    setVoiceState("ready");
    setRecordingState("idle");
    setCurrentTask("Completed");
    await new Promise((r) => setTimeout(r, 3000));
    setVoiceState("idle");
    setTranscript("");
    setResponse("");
    setTasks([]);
    setCurrentTask("");
  }, []);

  const handleMicToggle = () => {
    if (recordingState === "idle") simulateVoiceInteraction();
    else {
      setRecordingState("idle");
      setVoiceState("idle");
    }
  };
  const handleHoldStart = () => {
    if (recordingState === "idle") {
      setVoiceState("listening");
      setRecordingState("recording");
    }
  };
  const handleHoldEnd = () => {
    if (recordingState === "recording") {
      setRecordingState("processing");
      setVoiceState("thinking");
      setTimeout(() => {
        setVoiceState("idle");
        setRecordingState("idle");
      }, 2000);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#050505] overflow-hidden font-sans selection:bg-[#00ff88]/30">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00ff88]/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00cc6a]/5 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00ff88]/3 rounded-full blur-[150px]" />
      </div>
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,136,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <Header
        voiceState={voiceState}
        onSettings={() => setShowSettings(true)}
      />
      <GlobeAI voiceState={voiceState} />
      <LeftPanel
        status={systemStatus}
        transcript={transcript}
        isActive={voiceState === "listening"}
      />
      <RightPanel
        currentTask={currentTask}
        modelName={systemStatus.modelName}
      />
      <Dock
        recordingState={recordingState}
        isMuted={isMuted}
        onMicToggle={handleMicToggle}
        onMuteToggle={() => setIsMuted(!isMuted)}
        onInterrupt={() => {
          setVoiceState("idle");
          setRecordingState("idle");
          setTranscript("");
          setResponse("");
        }}
        onHoldStart={handleHoldStart}
        onHoldEnd={handleHoldEnd}
      />

      {/* Central Response Card */}
      <div className="absolute top-[65%] left-1/2 -translate-x-1/2 w-full max-w-xl z-30 pointer-events-none">
        <AnimatePresence>
          {response && (
            <GlassCard glow>
              <div className="p-6 pointer-events-auto">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-[#00ff88]/60" />
                  <span className="text-white/40 text-xs uppercase tracking-widest">
                    Response
                  </span>
                </div>
                <p className="text-white/80 text-center text-sm leading-relaxed font-light mb-4">
                  {response}
                </p>
                {tasks.length > 0 && (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5"
                      >
                        {task.status === "running" ? (
                          <Loader2 className="w-4 h-4 text-[#00ff88] animate-spin" />
                        ) : task.status === "completed" ? (
                          <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
                        ) : (
                          <Circle className="w-4 h-4 text-white/30" />
                        )}
                        <span className="text-white/70 text-sm flex-1">
                          {task.label}
                        </span>
                        {task.progress !== undefined && (
                          <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-[#00ff88] rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${task.progress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg mx-4"
            >
              <GlassCard glow className="w-full">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-white text-xl font-semibold">
                      Settings
                    </h2>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="p-2 rounded-lg hover:bg-white/10"
                    >
                      <X className="w-5 h-5 text-white/60" />
                    </button>
                  </div>
                  <div className="space-y-6">
                    {[
                      {
                        label: "Local TTS",
                        desc: "Use local text-to-speech engine",
                        enabled: true,
                      },
                      {
                        label: "Auto Execute",
                        desc: "Run commands without confirmation",
                        enabled: false,
                      },
                    ].map((setting) => (
                      <div
                        key={setting.label}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <span className="text-white/80 text-sm block">
                            {setting.label}
                          </span>
                          <span className="text-white/40 text-xs">
                            {setting.desc}
                          </span>
                        </div>
                        <button
                          className={`w-11 h-6 rounded-full relative ${setting.enabled ? "bg-[#00ff88]/30" : "bg-white/10"}`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${setting.enabled ? "left-6 bg-[#00ff88]" : "left-1 bg-white/40"}`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IRISZero;
