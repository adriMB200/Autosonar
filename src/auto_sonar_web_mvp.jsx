import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Mic,
  Upload,
  Car,
  Wrench,
  Gauge,
  ShieldAlert,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const sampleResults = [
  {
    title: "Posible desgaste en correa o polea",
    confidence: 78,
    severity: "Media",
    detail:
      "El sonido agudo y repetitivo puede sugerir fricción en una correa auxiliar, tensor o polea. Conviene revisarlo antes de un viaje largo.",
  },
  {
    title: "Ruido compatible con rodamiento",
    confidence: 62,
    severity: "Media",
    detail:
      "La vibración grave y constante parece aumentar con las revoluciones. Podría venir de un rodamiento, alternador o componente giratorio cercano.",
  },
  {
    title: "No se detectan golpes internos claros",
    confidence: 54,
    severity: "Baja",
    detail:
      "No aparece un patrón fuerte de picado metálico interno, aunque haría falta una grabación más limpia para descartar fallos más serios.",
  },
];

const brands = ["Volkswagen", "BMW", "Audi", "Mercedes-Benz", "Toyota", "Ford", "Renault", "Peugeot", "SEAT", "Hyundai"];
const engines = ["Gasolina", "Diésel", "Híbrido", "Eléctrico", "GLP"];

export default function AutoSonarLanding() {
  const [mode, setMode] = useState("upload");
  const [brand, setBrand] = useState("Volkswagen");
  const [model, setModel] = useState("Golf");
  const [year, setYear] = useState("2016");
  const [engine, setEngine] = useState("Diésel");
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const carSummary = useMemo(() => {
    return `${brand} ${model || "modelo"} · ${year || "año"} · ${engine}`;
  }, [brand, model, year, engine]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.28),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.16),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col justify-center"
          >
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 backdrop-blur">
              <Volume2 className="h-4 w-4" />
              Diagnóstico acústico para coches
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
              Como Shazam, pero para entender qué le pasa a tu coche.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
              Sube un audio o graba desde el micrófono. La herramienta analiza el patrón del sonido y cruza la información con marca, modelo, año y motor para orientar un posible diagnóstico.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#diagnostico" className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 font-medium text-neutral-950 shadow-lg shadow-white/10 transition hover:bg-neutral-200">
                Probar diagnóstico demo
                <ChevronRight className="ml-2 h-4 w-4" />
              </a>
              <a href="#como-funciona" className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-medium text-white transition hover:bg-white/10">
                Ver cómo funcionaría
              </a>
            </div>
            <p className="mt-5 text-sm text-neutral-400">
              Pensado como MVP: primero web, después app móvil con grabación guiada, historial y red de talleres.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/40 backdrop-blur"
          >
            <div className="rounded-[1.5rem] bg-neutral-950 p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm text-neutral-400">Análisis actual</p>
                  <h2 className="text-xl font-semibold">Ruido al acelerar</h2>
                </div>
                <div className="rounded-full bg-emerald-500/15 p-3 text-emerald-300">
                  <Mic className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 h-28 rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-900 to-neutral-800 p-4">
                <div className="flex h-full items-end gap-1">
                  {[18, 42, 28, 68, 35, 84, 52, 72, 40, 62, 26, 54, 80, 48, 34, 70, 30, 58, 76, 44].map((height, index) => (
                    <motion.div
                      key={index}
                      initial={{ height: 8 }}
                      animate={{ height }}
                      transition={{ repeat: Infinity, repeatType: "mirror", duration: 0.9 + index * 0.02 }}
                      className="w-full rounded-full bg-white/70"
                    />
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {sampleResults.slice(0, 2).map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-neutral-400">Confianza estimada: {item.confidence}%</p>
                      </div>
                      <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-200">{item.severity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">Funcionamiento</p>
          <h2 className="mt-3 text-3xl font-semibold md:text-5xl">Un diagnóstico más útil empieza con buen contexto.</h2>
          <p className="mt-5 text-neutral-300">
            Un mismo ruido no significa lo mismo en un diésel antiguo que en un híbrido reciente. Por eso el sistema no solo escucha: también pregunta por el coche.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Upload,
              title: "1. Graba o sube un audio",
              text: "El usuario puede grabar el motor en frío, al acelerar, al girar o al frenar. También puede subir un archivo ya grabado.",
            },
            {
              icon: Car,
              title: "2. Identifica el vehículo",
              text: "Marca, modelo, año, motor, kilometraje y situación del ruido ayudan a reducir diagnósticos poco probables.",
            },
            {
              icon: Wrench,
              title: "3. Recibe una orientación",
              text: "La web muestra posibles causas, nivel de urgencia, pasos básicos y cuándo conviene acudir a un taller.",
            },
          ].map((step) => (
            <div key={step.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-neutral-950">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 leading-7 text-neutral-300">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="diagnostico" className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">Demo del producto</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-5xl">Prueba de diagnóstico</h2>
            <p className="mt-5 leading-8 text-neutral-300">
              Esta pantalla simula el flujo principal de la futura app. El resultado real necesitaría un modelo entrenado con miles de audios etiquetados por mecánicos.
            </p>

            <div className="mt-8 rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
              <div className="flex gap-3">
                <ShieldAlert className="mt-1 h-5 w-5 shrink-0" />
                <p className="text-sm leading-6">
                  La herramienta no sustituye a un mecánico. Debe presentarse como ayuda orientativa, especialmente si hay humo, pérdida de potencia, olor a quemado o testigos encendidos.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-neutral-950 p-5 shadow-xl">
            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() => setMode("upload")}
                className={`rounded-2xl border p-5 text-left transition ${mode === "upload" ? "border-white bg-white text-neutral-950" : "border-white/10 bg-white/[0.04] text-white hover:bg-white/10"}`}
              >
                <Upload className="mb-4 h-6 w-6" />
                <p className="font-semibold">Subir audio</p>
                <p className={`mt-1 text-sm ${mode === "upload" ? "text-neutral-600" : "text-neutral-400"}`}>MP3, WAV o M4A</p>
              </button>
              <button
                onClick={() => setMode("record")}
                className={`rounded-2xl border p-5 text-left transition ${mode === "record" ? "border-white bg-white text-neutral-950" : "border-white/10 bg-white/[0.04] text-white hover:bg-white/10"}`}
              >
                <Mic className="mb-4 h-6 w-6" />
                <p className="font-semibold">Usar micrófono</p>
                <p className={`mt-1 text-sm ${mode === "record" ? "text-neutral-600" : "text-neutral-400"}`}>Grabación guiada</p>
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-6 text-center">
              <Volume2 className="mx-auto h-8 w-8 text-neutral-300" />
              <p className="mt-3 font-medium">{mode === "upload" ? "Arrastra aquí el audio del motor" : "Pulsa para empezar a grabar"}</p>
              <p className="mt-1 text-sm text-neutral-400">Ideal: 10 a 20 segundos, sin música ni viento fuerte.</p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="text-neutral-300">Marca</span>
                <select value={brand} onChange={(e) => setBrand(e.target.value)} className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-white/40">
                  {brands.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-neutral-300">Modelo</span>
                <input value={model} onChange={(e) => setModel(e.target.value)} className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-white/40" placeholder="Ej. Golf" />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-neutral-300">Año</span>
                <input value={year} onChange={(e) => setYear(e.target.value)} className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-white/40" placeholder="Ej. 2016" />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-neutral-300">Motor</span>
                <select value={engine} onChange={(e) => setEngine(e.target.value)} className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-white/40">
                  {engines.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>

            <label className="mt-4 grid gap-2 text-sm">
              <span className="text-neutral-300">¿Cuándo aparece el ruido?</span>
              <textarea className="min-h-24 rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-white/40" placeholder="Ej. Suena en frío durante 30 segundos, sobre todo al arrancar y al girar el volante." />
            </label>

            <button
              onClick={() => setIsAnalyzed(true)}
              className="mt-5 flex w-full items-center justify-center rounded-2xl bg-emerald-400 px-5 py-4 font-semibold text-neutral-950 transition hover:bg-emerald-300"
            >
              Analizar sonido
              <Sparkles className="ml-2 h-5 w-5" />
            </button>

            {isAnalyzed && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                <div className="mb-4 flex items-center gap-2 text-sm text-neutral-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Resultado demo para {carSummary}
                </div>
                <div className="grid gap-3">
                  {sampleResults.map((result) => (
                    <div key={result.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-semibold">{result.title}</h3>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-neutral-200">{result.confidence}% confianza</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-neutral-300">{result.detail}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-purple-300">Roadmap</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-5xl">De web a app completa.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              "Historial de diagnósticos por vehículo",
              "Grabación guiada: ralentí, aceleración, frenada y giro",
              "Base de datos de sonidos reales validados por talleres",
              "Informe descargable para enseñar al mecánico",
              "Avisos de urgencia y recomendaciones de seguridad",
              "Integración con talleres cercanos o asistencia",
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <p className="text-neutral-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-semibold">Nombre provisional: AutoSonar</h2>
              <p className="mt-3 max-w-2xl leading-7 text-neutral-300">
                Una primera versión razonable podría centrarse en pocos sonidos frecuentes: correas, rodamientos, escape, frenos, golpes de suspensión y fallos de arranque.
              </p>
            </div>
            <a href="#diagnostico" className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200">
              Empezar demo
              <Gauge className="ml-2 h-5 w-5" />
            </a>
          </div>
          <div className="mt-8 flex gap-3 rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Para evitar problemas legales y de confianza, los resultados deberían decir “posible causa” y no “diagnóstico definitivo”. La app debe recomendar taller si detecta riesgo alto.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
