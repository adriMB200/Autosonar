import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import {
  Mic,
  Upload,
  Car,
  Wrench,
  ShieldAlert,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Square,
  Loader2,
  Download,
  Gauge,
  Clock,
  FileText,
  ShieldCheck,
  Search,
} from "lucide-react";

const AUTHOR = "AdriMB200";
const GITHUB_URL = "https://github.com/adriMB200";

const MAX_AUDIO_SIZE_MB = 5;
const MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024;
const DIAGNOSIS_HISTORY_KEY = "autosonar_diagnosis_history";
const MAX_HISTORY_ITEMS = 10;

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

const brands = [
  "Volkswagen",
  "BMW",
  "Audi",
  "Mercedes-Benz",
  "Toyota",
  "Ford",
  "Renault",
  "Peugeot",
  "SEAT",
  "Hyundai",
];

const engines = ["Gasolina", "Diésel", "Híbrido", "Eléctrico", "GLP"];

const detectableProblems = [
  {
    title: "Ruidos de correa o polea",
    text: "Chirridos agudos al arrancar, acelerar o girar el volante.",
  },
  {
    title: "Frenos que chirrían",
    text: "Sonidos metálicos, rozamientos o vibraciones al frenar.",
  },
  {
    title: "Golpes de suspensión",
    text: "Ruidos secos al pasar baches, badenes o carreteras irregulares.",
  },
  {
    title: "Vibraciones al acelerar",
    text: "Sonidos graves o repetitivos que aumentan con las revoluciones.",
  },
  {
    title: "Silbidos o fugas",
    text: "Ruidos de aire, escape, turbo o posibles pérdidas de presión.",
  },
  {
    title: "Ruido al arrancar",
    text: "Traqueteos, golpes o sonidos raros durante los primeros segundos.",
  },
];

const trustPoints = [
  {
    title: "Orientación clara, no promesas falsas",
    text: "AutoSonar no sustituye a un mecánico. Te ayuda a entender posibles causas antes de ir al taller.",
  },
  {
    title: "Nivel de urgencia",
    text: "Cada resultado indica si el problema parece leve, medio o urgente.",
  },
  {
    title: "Calidad del audio",
    text: "Si el sonido no se escucha bien, la herramienta lo indica en vez de inventar una respuesta.",
  },
  {
    title: "Informe descargable",
    text: "Puedes guardar el resultado en PDF para enseñarlo en el taller.",
  },
];

const pricingPlans = [
  {
    name: "Gratis",
    price: "0 €",
    description: "Para usuarios que quieren una primera orientación.",
    features: [
      "Diagnóstico orientativo",
      "Subida o grabación de audio",
      "Resultado básico con urgencia",
      "Aviso de seguridad",
    ],
  },
  {
    name: "Pro",
    price: "Próximamente",
    description: "Pensado para usuarios con varios vehículos o revisiones frecuentes.",
    features: [
      "Historial de diagnósticos",
      "Informes PDF completos",
      "Varios vehículos guardados",
      "Mayor límite de análisis",
    ],
  },
  {
    name: "Talleres",
    price: "Próximamente",
    description: "Para talleres que quieran recibir informes previos de clientes.",
    features: [
      "Panel de clientes",
      "Informes recibidos",
      "Datos del vehículo estructurados",
      "Contacto con usuarios interesados",
    ],
  },
];


const quickSymptomOptions = [
  "Aparece en frío",
  "Aumenta al acelerar",
  "Suena al frenar",
  "Suena al girar",
  "Ruido metálico",
  "Vibración en marcha",
  "Pérdida de potencia",
  "Humo visible",
  "Olor a quemado",
  "Testigo encendido",
];

const diagnosticSteps = [
  {
    number: 1,
    title: "Coche",
    description: "Marca, modelo, año y motor",
  },
  {
    number: 2,
    title: "Síntomas",
    description: "Cuándo aparece el ruido",
  },
  {
    number: 3,
    title: "Audio",
    description: "Sube o graba el sonido",
  },
  {
    number: 4,
    title: "Resultado",
    description: "Análisis con IA e informe",
  },
];

function getSupportedAudioMimeType(file) {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (type === "audio/wav" || type === "audio/x-wav" || name.endsWith(".wav")) {
    return "audio/wav";
  }

  if (type === "audio/mpeg" || type === "audio/mp3" || name.endsWith(".mp3")) {
    return "audio/mp3";
  }

  if (type === "audio/aac" || name.endsWith(".aac")) {
    return "audio/aac";
  }

  if (type === "audio/ogg" || name.endsWith(".ogg")) {
    return "audio/ogg";
  }

  if (type === "audio/flac" || name.endsWith(".flac")) {
    return "audio/flac";
  }

  if (
    type === "audio/aiff" ||
    type === "audio/x-aiff" ||
    name.endsWith(".aiff") ||
    name.endsWith(".aif")
  ) {
    return "audio/aiff";
  }

  return null;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getBestRecorderMimeType() {
  if (!window.MediaRecorder) return "";

  const types = [
    "audio/webm;codecs=opus",
    "audio/ogg;codecs=opus",
    "audio/webm",
    "audio/ogg",
  ];

  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i += 1) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function audioBufferToWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const samples = audioBuffer.length;
  const dataSize = samples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  const channelData = [];

  for (let channel = 0; channel < numChannels; channel += 1) {
    channelData.push(audioBuffer.getChannelData(channel));
  }

  for (let i = 0; i < samples; i += 1) {
    for (let channel = 0; channel < numChannels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

async function convertRecordedBlobToWav(blob) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("Tu navegador no permite convertir la grabación a WAV.");
  }

  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContextClass();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  const wavBlob = audioBufferToWav(audioBuffer);

  if (audioContext.close) {
    await audioContext.close();
  }

  return wavBlob;
}

function urgencyBadgeClass(urgency) {
  if (urgency === "alta") {
    return "bg-red-400/15 text-red-200";
  }

  if (urgency === "media") {
    return "bg-amber-400/15 text-amber-200";
  }

  return "bg-emerald-400/15 text-emerald-200";
}

function SonarSearching() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="mt-5 rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6 text-center"
    >
      <style>
        {`
          @keyframes autosonarPing {
            0% { transform: scale(0.25); opacity: 0.9; }
            75% { opacity: 0.18; }
            100% { transform: scale(1); opacity: 0; }
          }

          @keyframes autosonarSweep {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes autosonarDot {
            0%, 100% { opacity: 0.35; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.15); }
          }

          @keyframes autosonarText {
            0%, 100% { opacity: 0.55; }
            50% { opacity: 1; }
          }
        `}
      </style>

      <div className="mx-auto flex max-w-sm flex-col items-center">
        <div className="relative h-44 w-44 overflow-hidden rounded-full border border-emerald-300/30 bg-neutral-950 shadow-2xl shadow-emerald-950/40">
          <div className="absolute inset-4 rounded-full border border-emerald-300/15" />
          <div className="absolute inset-10 rounded-full border border-emerald-300/15" />
          <div className="absolute inset-16 rounded-full border border-emerald-300/15" />

          <div
            className="absolute inset-0 rounded-full border border-emerald-300/40"
            style={{ animation: "autosonarPing 2.2s linear infinite" }}
          />
          <div
            className="absolute inset-0 rounded-full border border-emerald-300/30"
            style={{
              animation: "autosonarPing 2.2s linear infinite",
              animationDelay: "0.7s",
            }}
          />
          <div
            className="absolute inset-0 rounded-full border border-emerald-300/20"
            style={{
              animation: "autosonarPing 2.2s linear infinite",
              animationDelay: "1.4s",
            }}
          />

          <div
            className="absolute left-1/2 top-1/2 h-px w-1/2 origin-left bg-gradient-to-r from-emerald-300 via-emerald-300/70 to-transparent"
            style={{ animation: "autosonarSweep 1.7s linear infinite" }}
          />

          <div
            className="absolute left-[62%] top-[30%] h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-lg shadow-emerald-300/60"
            style={{ animation: "autosonarDot 1.4s ease-in-out infinite" }}
          />
          <div
            className="absolute left-[31%] top-[58%] h-2 w-2 rounded-full bg-emerald-200 shadow-lg shadow-emerald-300/60"
            style={{ animation: "autosonarDot 1.8s ease-in-out infinite" }}
          />
          <div
            className="absolute left-[70%] top-[66%] h-1.5 w-1.5 rounded-full bg-emerald-100 shadow-lg shadow-emerald-300/60"
            style={{ animation: "autosonarDot 1.2s ease-in-out infinite" }}
          />

          <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg shadow-white/50" />
        </div>

        <p
          className="mt-5 text-base font-semibold text-emerald-100"
          style={{ animation: "autosonarText 1.4s ease-in-out infinite" }}
        >
          Escuchando el patrón del sonido...
        </p>

        <p className="mt-2 text-sm leading-6 text-emerald-100/75">
          Analizando frecuencias, vibraciones y contexto del vehículo. Puede tardar unos segundos.
        </p>
      </div>
    </motion.div>
  );
}

function CookieBanner() {
  const [cookieChoice, setCookieChoice] = useState(null);

  useEffect(() => {
    const savedChoice = localStorage.getItem("autosonar_cookie_choice");
    setCookieChoice(savedChoice);
  }, []);

  function handleCookieChoice(choice) {
    localStorage.setItem("autosonar_cookie_choice", choice);
    localStorage.setItem("autosonar_cookie_choice_date", new Date().toISOString());
    setCookieChoice(choice);
  }

  if (cookieChoice) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-5xl rounded-[1.5rem] border border-white/10 bg-neutral-950/95 p-5 text-white shadow-2xl shadow-black/50 backdrop-blur">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-base font-semibold">Aviso de cookies</h2>

          <p className="mt-2 text-sm leading-6 text-neutral-300">
            AutoSonar utiliza cookies técnicas y almacenamiento local para recordar
            tus preferencias y mejorar la experiencia de uso. En esta versión no
            usamos cookies publicitarias ni de analítica avanzada. Si más adelante
            añadimos estadísticas o publicidad, actualizaremos este aviso.
          </p>

          <a
            href="#aviso-legal"
            className="mt-2 inline-block text-sm font-medium text-emerald-300 hover:text-emerald-200"
          >
            Ver aviso legal y condiciones de uso
          </a>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
          <button
            type="button"
            onClick={() => handleCookieChoice("accepted")}
            className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-300"
          >
            Aceptar
          </button>

          <button
            type="button"
            onClick={() => handleCookieChoice("rejected")}
            className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

function LegalNotice() {
  return (
    <section
      id="aviso-legal"
      className="border-t border-white/10 bg-neutral-950 px-6 py-20 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-red-300">
          Aviso legal
        </p>

        <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
          Condiciones de uso y responsabilidad
        </h2>

        <div className="mt-8 grid gap-5 text-sm leading-7 text-neutral-300">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold text-white">
              Autoría, titularidad y derechos de propiedad intelectual
            </h3>

            <p className="mt-3">
              <strong>AutoSonar</strong> ha sido creada por{" "}
              <strong>{AUTHOR}</strong>. El repositorio principal del autor está en{" "}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 hover:text-emerald-200"
              >
                {GITHUB_URL}
              </a>.
            </p>

            <p className="mt-3">
              Salvo que se indique lo contrario, todos los elementos originales de esta web,
              incluyendo su código propio, diseño, organización de contenidos, textos,
              selección de funcionalidades, nombre del proyecto, experiencia de usuario y
              planteamiento de diagnóstico acústico aplicado a vehículos, pertenecen a su autor.
            </p>

            <p className="mt-3">
              Queda expresamente prohibida la copia, reproducción, distribución, modificación,
              publicación, cesión, venta, transformación o explotación comercial no autorizada
              de AutoSonar o de cualquiera de sus elementos originales.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-red-300/20 bg-red-300/10 p-6 text-red-100">
            <h3 className="text-lg font-semibold text-white">
              Prohibición de plagio o uso no autorizado
            </h3>

            <p className="mt-3">
              AutoSonar es un proyecto original desarrollado como herramienta de análisis
              acústico orientativo para vehículos. No se autoriza a terceros a copiar la web,
              replicar su presentación, reutilizar sus textos, apropiarse de su identidad,
              clonar su estructura visual o presentarla como un desarrollo propio.
            </p>

            <p className="mt-3">
              Cualquier uso no autorizado podrá ser considerado una vulneración de los derechos
              del autor sobre la obra concreta, sin perjuicio de otras acciones que pudieran
              corresponder conforme a la normativa aplicable.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-6 text-amber-100">
            <h3 className="text-lg font-semibold text-white">
              Uso orientativo de los diagnósticos
            </h3>

            <p className="mt-3">
              Los resultados generados por AutoSonar son únicamente una orientación basada en el
              audio enviado, los datos del vehículo y el análisis realizado mediante inteligencia
              artificial. No deben considerarse un diagnóstico definitivo ni sustituyen la revisión
              de un mecánico profesional.
            </p>

            <p className="mt-3">
              El usuario entiende que un mismo ruido puede tener varias causas, que la calidad del
              audio puede afectar al resultado y que la IA puede cometer errores, omitir información
              o interpretar el sonido de forma incorrecta.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-red-300/20 bg-red-300/10 p-6 text-red-100">
            <h3 className="text-lg font-semibold text-white">
              Exención de responsabilidad
            </h3>

            <p className="mt-3">
              El autor de esta web no se hace responsable, en la medida permitida por la ley, de
              daños, averías, accidentes, pérdidas económicas, decisiones de reparación, uso indebido
              del vehículo o cualquier consecuencia derivada de seguir, interpretar o aplicar los
              diagnósticos generados por AutoSonar.
            </p>

            <p className="mt-3">
              Si el vehículo presenta síntomas graves como pérdida de potencia, humo, olor a quemado,
              testigos encendidos, fallo de frenos, dirección anómala, golpes fuertes o riesgo para
              la circulación, el usuario debe dejar de circular si es necesario y consultar con un
              taller o servicio de asistencia profesional.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold text-white">
              Tratamiento de audios y datos introducidos
            </h3>

            <p className="mt-3">
              Para realizar el análisis, el usuario puede enviar un archivo de audio o grabar sonido
              desde el micrófono, junto con datos como marca, modelo, año, motor y descripción del
              síntoma. Esta información se utiliza para generar una respuesta orientativa.
            </p>

            <p className="mt-3">
              No subas audios que contengan conversaciones privadas, datos personales sensibles o
              información que no quieras compartir con los servicios técnicos necesarios para procesar
              el diagnóstico.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold text-white">
              Cookies y almacenamiento local
            </h3>

            <p className="mt-3">
              AutoSonar puede utilizar cookies técnicas o almacenamiento local del navegador para
              recordar preferencias básicas, como la decisión sobre el aviso de cookies. En esta
              versión no se utilizan cookies publicitarias ni de seguimiento avanzado.
            </p>

            <p className="mt-3">
              Si en el futuro se añaden herramientas de analítica, publicidad o servicios de terceros
              que utilicen cookies no técnicas, se deberá actualizar este aviso y solicitar el
              consentimiento correspondiente.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold text-white">
              Aceptación de las condiciones
            </h3>

            <p className="mt-3">
              Al utilizar AutoSonar, el usuario acepta que la herramienta tiene carácter experimental y
              orientativo. La decisión final sobre el estado del vehículo, su reparación o su uso en
              carretera debe ser tomada por el usuario y, cuando corresponda, por un profesional
              cualificado.
            </p>

            <p className="mt-3 text-neutral-400">
              Última actualización: 2026.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function sanitizePdfText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[•]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[©]/g, "(c)")
    .replace(/[·]/g, "-");
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight = 6) {
  const cleanText = sanitizePdfText(text);
  const lines = doc.splitTextToSize(cleanText, maxWidth);

  lines.forEach((line) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    doc.text(line, x, y);
    y += lineHeight;
  });

  return y;
}

function addSectionTitle(doc, title, y) {
  if (y > 265) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(sanitizePdfText(title), 15, y);

  doc.setDrawColor(16, 185, 129);
  doc.line(15, y + 2, 195, y + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  return y + 9;
}

function addKeyValue(doc, label, value, x, y) {
  doc.setFont("helvetica", "bold");
  doc.text(sanitizePdfText(label), x, y);

  doc.setFont("helvetica", "normal");
  doc.text(sanitizePdfText(value || "No indicado"), x + 38, y);

  return y + 7;
}

function addFooterToAllPages(doc) {
  const pageCount = doc.internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);

    doc.text(
      `AutoSonar - Informe orientativo - Pagina ${page} de ${pageCount}`,
      15,
      287
    );

    doc.text(
      "Este informe no sustituye la revision de un mecanico profesional.",
      105,
      287,
      { align: "center" }
    );
  }
}

function CopyrightFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-neutral-950 px-6 py-10 text-center lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-neutral-300">
          © {year} AutoSonar · Proyecto, concepto, diseño, textos e implementación
          desarrollados por <strong className="text-white">{AUTHOR}</strong>. Todos los derechos reservados.
        </p>

        <p className="mt-3 text-xs leading-6 text-neutral-500">
          Queda prohibida la copia, reproducción, distribución, modificación, publicación o explotación
          comercial no autorizada de esta web, su código, diseño, textos, estructura, marca, nombre del
          proyecto o cualquier elemento original propio de AutoSonar.
        </p>
      </div>
    </footer>
  );
}


function DiagnosisHistory({ history, onClearHistory, formatDate }) {
  if (!history.length) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 md:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">
            Historial
          </p>

          <h2 className="mt-3 text-3xl font-semibold text-white md:text-5xl">
            Tus diagnósticos aparecerán aquí.
          </h2>

          <p className="mt-5 max-w-2xl leading-8 text-neutral-300">
            Cuando analices un sonido, AutoSonar guardará un resumen local en este navegador.
            En futuras versiones, este historial podrá sincronizarse con una cuenta de usuario.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">
            Historial
          </p>

          <h2 className="mt-3 text-3xl font-semibold text-white md:text-5xl">
            Últimos diagnósticos
          </h2>

          <p className="mt-5 max-w-2xl leading-8 text-neutral-300">
            Consulta los últimos análisis realizados en este dispositivo. No se suben a una base
            de datos en esta versión.
          </p>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="inline-flex items-center justify-center rounded-2xl border border-red-300/20 px-5 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-300/10"
        >
          Borrar historial
        </button>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {history.map((item) => (
          <article
            key={item.id}
            className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-neutral-400">{formatDate(item.createdAt)}</p>

                <h3 className="mt-1 text-xl font-semibold text-white">{item.carSummary}</h3>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${urgencyBadgeClass(
                  item.result?.urgencia_general
                )}`}
              >
                Urgencia: {item.result?.urgencia_general || "sin valorar"}
              </span>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-neutral-300">
              <p>
                <span className="font-semibold text-white">Audio:</span> {item.audioName}
              </p>

              <p>
                <span className="font-semibold text-white">Calidad:</span>{" "}
                {item.result?.calidad_audio || "No indicada"}
              </p>

              <p className="leading-6">
                <span className="font-semibold text-white">Síntoma:</span> {item.situation}
              </p>

              <p className="leading-6">
                <span className="font-semibold text-white">Resumen:</span> {item.result?.resumen}
              </p>
            </div>

            {item.result?.posibles_causas?.length > 0 && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-neutral-950/60 p-4">
                <p className="text-sm font-semibold text-white">Posibles causas guardadas</p>

                <ul className="mt-3 space-y-2 text-sm text-neutral-300">
                  {item.result.posibles_causas.slice(0, 3).map((cause, index) => (
                    <li key={`${cause.causa}-${index}`}>
                      {index + 1}. {cause.causa}{" "}
                      {cause.confianza !== undefined ? `(${cause.confianza}% confianza)` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default function AutoSonarLanding() {
  const [mode, setMode] = useState("upload");
  const [brand, setBrand] = useState("Volkswagen");
  const [model, setModel] = useState("Golf");
  const [year, setYear] = useState("2016");
  const [engine, setEngine] = useState("Diésel");
  const [situation, setSituation] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [quickSymptoms, setQuickSymptoms] = useState([]);

  const [audioFile, setAudioFile] = useState(null);
  const [audioMimeType, setAudioMimeType] = useState("");
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [diagnosisHistory, setDiagnosisHistory] = useState([]);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const carSummary = useMemo(() => {
    return `${brand} ${model || "modelo"} · ${year || "año"} · ${engine}`;
  }, [brand, model, year, engine]);

  const selectedSymptomsText = useMemo(() => {
    if (quickSymptoms.length === 0) return "";
    return `Síntomas marcados: ${quickSymptoms.join(", ")}.`;
  }, [quickSymptoms]);

  const diagnosticContext = useMemo(() => {
    return [situation.trim(), selectedSymptomsText].filter(Boolean).join("\n");
  }, [situation, selectedSymptomsText]);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(DIAGNOSIS_HISTORY_KEY);

      if (!savedHistory) return;

      const parsedHistory = JSON.parse(savedHistory);

      if (Array.isArray(parsedHistory)) {
        setDiagnosisHistory(parsedHistory);
      }
    } catch {
      localStorage.removeItem(DIAGNOSIS_HISTORY_KEY);
    }
  }, []);

  function toggleQuickSymptom(symptom) {
    setQuickSymptoms((currentSymptoms) => {
      if (currentSymptoms.includes(symptom)) {
        return currentSymptoms.filter((item) => item !== symptom);
      }

      return [...currentSymptoms, symptom];
    });

    setAiResult(null);
    setAnalyzeError("");
  }

  function goToStep(step) {
    setCurrentStep(step);
    setAnalyzeError("");
  }

  function goToNextStep() {
    setAnalyzeError("");

    if (currentStep === 1 && (!model.trim() || !year.trim())) {
      setAnalyzeError("Indica al menos el modelo y el año para continuar.");
      return;
    }

    if (currentStep === 3 && !audioFile) {
      setAnalyzeError("Sube un audio o graba el sonido antes de continuar.");
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, diagnosticSteps.length));
  }

  function goToPreviousStep() {
    setAnalyzeError("");
    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  function setSelectedAudio(file, mimeType) {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }

    setAudioFile(file);
    setAudioMimeType(mimeType);
    setAudioPreviewUrl(URL.createObjectURL(file));
    setAiResult(null);
    setAnalyzeError("");
  }

  function handleAudioFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const mimeType = getSupportedAudioMimeType(file);

    if (!mimeType) {
      setAnalyzeError("Formato no válido. Usa MP3, WAV, AAC, OGG, FLAC o AIFF.");
      setAudioFile(null);
      setAudioMimeType("");
      setAudioPreviewUrl("");
      return;
    }

    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      setAnalyzeError(
        `El audio pesa demasiado. Usa un archivo de menos de ${MAX_AUDIO_SIZE_MB} MB, idealmente 10-20 segundos.`
      );
      setAudioFile(null);
      setAudioMimeType("");
      setAudioPreviewUrl("");
      return;
    }

    setSelectedAudio(file, mimeType);
  }

  async function startRecording() {
    try {
      setMode("record");
      setAnalyzeError("");
      setAiResult(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setAnalyzeError("Tu navegador no permite grabar audio desde la web.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorderMimeType = getBestRecorderMimeType();
      const recorder = new MediaRecorder(
        stream,
        recorderMimeType ? { mimeType: recorderMimeType } : undefined
      );

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const recordedBlob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });

          const wavBlob = await convertRecordedBlobToWav(recordedBlob);

          const wavFile = new File([wavBlob], `autosonar-${Date.now()}.wav`, {
            type: "audio/wav",
          });

          if (wavFile.size > MAX_AUDIO_SIZE_BYTES) {
            setAnalyzeError(
              `La grabación pesa demasiado. Prueba con menos segundos. Límite actual: ${MAX_AUDIO_SIZE_MB} MB.`
            );
            return;
          }

          setSelectedAudio(wavFile, "audio/wav");
        } catch (error) {
          setAnalyzeError(
            error.message ||
            "No he podido preparar la grabación. Prueba subiendo un MP3 o WAV."
          );
        } finally {
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setIsRecording(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      setAnalyzeError(
        error.message ||
        "No he podido acceder al micrófono. Revisa los permisos del navegador."
      );
      setIsRecording(false);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
  }


  function saveDiagnosisToHistory(result) {
    const historyItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      createdAt: new Date().toISOString(),
      vehicle: {
        brand,
        model,
        year,
        engine,
      },
      carSummary,
      situation: diagnosticContext || situation || "No indicado",
      audioName: audioFile?.name || "Audio no indicado",
      result: {
        sonido_identificado: result?.sonido_identificado,
        resumen: result?.resumen || "Sin resumen",
        calidad_audio: result?.calidad_audio || "No indicada",
        urgencia_general: result?.urgencia_general || "No indicada",
        posibles_causas: Array.isArray(result?.posibles_causas) ? result.posibles_causas : [],
        recomendacion: result?.recomendacion || "",
        advertencia: result?.advertencia || "",
      },
    };

    setDiagnosisHistory((currentHistory) => {
      const updatedHistory = [historyItem, ...currentHistory].slice(0, MAX_HISTORY_ITEMS);

      localStorage.setItem(DIAGNOSIS_HISTORY_KEY, JSON.stringify(updatedHistory));

      return updatedHistory;
    });
  }

  function clearDiagnosisHistory() {
    localStorage.removeItem(DIAGNOSIS_HISTORY_KEY);
    setDiagnosisHistory([]);
  }

  function formatHistoryDate(value) {
    try {
      return new Date(value).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha no disponible";
    }
  }

  async function analyzeWithAI() {
    try {
      setAnalyzeError("");
      setAiResult(null);

      if (!audioFile || !audioMimeType) {
        setAnalyzeError("Primero sube un audio o graba desde el micrófono.");
        return;
      }

      if (audioFile.size > MAX_AUDIO_SIZE_BYTES) {
        setAnalyzeError(`El audio pesa demasiado. Usa un archivo de menos de ${MAX_AUDIO_SIZE_MB} MB.`);
        return;
      }

      setIsAnalyzing(true);

      const audioBase64 = await fileToBase64(audioFile);

      const response = await fetch("/.netlify/functions/analyze-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand,
          model,
          year,
          engine,
          situation: diagnosticContext,
          audioBase64,
          audioMimeType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const details =
          typeof data.details === "string"
            ? data.details
            : data.error || "No se pudo analizar el audio";

        throw new Error(details);
      }

      setAiResult(data.result);
      saveDiagnosisToHistory(data.result);
      setCurrentStep(diagnosticSteps.length);
    } catch (error) {
      setAnalyzeError(error.message || "Error analizando el audio con IA.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function downloadDiagnosisPdf() {
    if (!aiResult) {
      setAnalyzeError("Primero genera un diagnóstico antes de descargar el informe.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const now = new Date();
    const fileDate = now.toISOString().slice(0, 10);
    const formattedDate = now.toLocaleString("es-ES");

    let y = 18;

    doc.setFillColor(10, 15, 20);
    doc.rect(0, 0, 210, 32, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("AutoSonar", 15, 16);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Informe de diagnostico acustico orientativo", 15, 24);

    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.text("Diagnose. Detect. Drive.", 195, 16, { align: "right" });

    doc.setTextColor(30, 30, 30);
    y = 42;

    y = addSectionTitle(doc, "1. Datos del informe", y);
    y = addKeyValue(doc, "Fecha:", formattedDate, 15, y);
    y = addKeyValue(doc, "Vehiculo:", carSummary, 15, y);
    y = addKeyValue(doc, "Audio:", audioFile?.name || "No indicado", 15, y);
    y += 3;

    y = addSectionTitle(doc, "2. Datos del vehiculo", y);
    y = addKeyValue(doc, "Marca:", brand, 15, y);
    y = addKeyValue(doc, "Modelo:", model, 15, y);
    y = addKeyValue(doc, "Anio:", year, 15, y);
    y = addKeyValue(doc, "Motor:", engine, 15, y);
    y += 3;

    y = addSectionTitle(doc, "3. Sintoma indicado por el usuario", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y = addWrappedText(
      doc,
      diagnosticContext || "El usuario no ha indicado una descripcion adicional del ruido.",
      15,
      y,
      180
    );
    y += 4;

    y = addSectionTitle(doc, "4. Resultado del analisis", y);
    y = addKeyValue(
      doc,
      "Identificado:",
      aiResult.sonido_identificado === false ? "No" : "Si",
      15,
      y
    );
    y = addKeyValue(doc, "Calidad:", aiResult.calidad_audio || "No indicada", 15, y);
    y = addKeyValue(doc, "Urgencia:", aiResult.urgencia_general || "No indicada", 15, y);
    y += 2;

    doc.setFont("helvetica", "bold");
    doc.text("Resumen:", 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    y = addWrappedText(doc, aiResult.resumen || "No se ha generado resumen.", 15, y, 180);
    y += 4;

    if (aiResult.informacion_encontrada) {
      y = addSectionTitle(doc, "5. Informacion encontrada", y);
      y = addWrappedText(doc, aiResult.informacion_encontrada, 15, y, 180);
      y += 4;
    }

    y = addSectionTitle(doc, "6. Posibles causas", y);

    if (aiResult.posibles_causas?.length > 0) {
      aiResult.posibles_causas.forEach((cause, index) => {
        if (y > 245) {
          doc.addPage();
          y = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`${index + 1}. ${sanitizePdfText(cause.causa || "Causa no indicada")}`, 15, y);
        y += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        y = addKeyValue(doc, "Confianza:", `${cause.confianza ?? "No indicada"}%`, 18, y);
        y = addKeyValue(doc, "Urgencia:", cause.urgencia || "No indicada", 18, y);

        doc.setFont("helvetica", "bold");
        doc.text("Explicacion:", 18, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        y = addWrappedText(doc, cause.explicacion || "No indicada.", 18, y, 174);
        y += 2;

        doc.setFont("helvetica", "bold");
        doc.text("Que hacer:", 18, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        y = addWrappedText(doc, cause.que_hacer || "No indicado.", 18, y, 174);
        y += 6;
      });
    } else {
      y = addWrappedText(
        doc,
        "No se ha identificado una causa suficientemente fiable. Se recomienda aportar mas sintomas o grabar otro audio mas claro.",
        15,
        y,
        180
      );
      y += 4;
    }

    if (aiResult.preguntas_para_afinar?.length > 0) {
      y = addSectionTitle(doc, "7. Preguntas para afinar el diagnostico", y);
      aiResult.preguntas_para_afinar.forEach((question, index) => {
        y = addWrappedText(doc, `${index + 1}. ${question}`, 15, y, 180);
      });
      y += 4;
    }

    y = addSectionTitle(doc, "8. Recomendacion", y);
    y = addWrappedText(
      doc,
      aiResult.recomendacion || "No se ha generado una recomendacion.",
      15,
      y,
      180
    );
    y += 4;

    y = addSectionTitle(doc, "9. Advertencia y exencion de responsabilidad", y);
    y = addWrappedText(
      doc,
      aiResult.advertencia ||
      "Los resultados de AutoSonar son orientativos y no sustituyen la revision de un mecanico profesional.",
      15,
      y,
      180
    );
    y += 4;

    y = addWrappedText(
      doc,
      "El autor de AutoSonar no se hace responsable de danos, averias, accidentes, perdidas economicas, decisiones de reparacion o cualquier consecuencia derivada de interpretar o seguir este informe. Si el vehiculo presenta perdida de potencia, humo, olor a quemado, testigos encendidos, fallo de frenos, direccion anomala o golpes fuertes, no sigas circulando y consulta con un taller o servicio de asistencia.",
      15,
      y,
      180
    );
    y += 4;

    y = addSectionTitle(doc, "10. Autor y copyright", y);
    y = addWrappedText(
      doc,
      `AutoSonar es un proyecto creado por ${AUTHOR}. Proyecto, concepto, diseno, textos e implementacion desarrollados como herramienta experimental de diagnostico acustico orientativo para vehiculos. Todos los derechos reservados.`,
      15,
      y,
      180
    );

    addFooterToAllPages(doc);

    const safeModel = sanitizePdfText(model || "vehiculo")
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "");

    doc.save(`autosonar-informe-${safeModel || "vehiculo"}-${fileDate}.pdf`);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <CookieBanner />

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
              <Volume2 className="h-4 w-4 text-emerald-300" />
              Diagnóstico acústico inteligente para coches
            </div>

            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Detecta posibles problemas de tu coche escuchando su sonido
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
              Graba o sube un audio del motor, frenos, suspensión o dirección. AutoSonar
              analiza el sonido con IA y te da una orientación clara antes de ir al taller.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#diagnostico"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 font-medium text-neutral-950 shadow-lg shadow-white/10 transition hover:bg-neutral-200"
              >
                Analizar mi coche ahora
                <ChevronRight className="ml-2 h-4 w-4" />
              </a>

              <a
                href="#detecta"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-medium text-white transition hover:bg-white/10"
              >
                Qué puede detectar
              </a>
            </div>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                { icon: Clock, value: "Segundos", label: "respuesta rápida" },
                { icon: FileText, value: "PDF", label: "informe descargable" },
                { icon: ShieldCheck, value: "Seguro", label: "clave protegida" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <item.icon className="h-5 w-5 text-emerald-300" />
                  <p className="mt-3 font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-sm text-neutral-400">{item.label}</p>
                </div>
              ))}
            </div>
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
                  {[
                    18, 42, 28, 68, 35, 84, 52, 72, 40, 62, 26, 54, 80, 48,
                    34, 70, 30, 58, 76, 44,
                  ].map((height, index) => (
                    <motion.div
                      key={index}
                      initial={{ height: 8 }}
                      animate={{ height }}
                      transition={{
                        repeat: Infinity,
                        repeatType: "mirror",
                        duration: 0.9 + index * 0.02,
                      }}
                      className="w-full rounded-full bg-white/70"
                    />
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {sampleResults.slice(0, 2).map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-neutral-400">
                          Confianza estimada: {item.confidence}%
                        </p>
                      </div>

                      <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-200">
                        {item.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="detecta" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">
            Qué puede detectar
          </p>

          <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
            Ruidos comunes que muchos conductores pasan por alto.
          </h2>

          <p className="mt-5 leading-8 text-neutral-300">
            AutoSonar está pensado para ayudar con sonidos habituales del coche:
            chirridos, golpes, vibraciones, silbidos o traqueteos. No confirma una
            avería al 100%, pero puede darte una primera pista útil.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {detectableProblems.map((item) => (
            <div
              key={item.title}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 transition hover:border-emerald-300/30 hover:bg-white/[0.07]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300">
                <Wrench className="h-5 w-5" />
              </div>

              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 leading-7 text-neutral-300">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">
                Confianza y transparencia
              </p>

              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
                Una ayuda previa al taller, no una promesa milagrosa.
              </h2>

              <p className="mt-5 leading-8 text-neutral-300">
                El usuario no necesita una respuesta exagerada. Necesita saber si el
                ruido puede ser leve, si conviene revisarlo pronto o si debería dejar
                de circular. Por eso AutoSonar muestra resultados prudentes y claros.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {trustPoints.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-6"
                >
                  <CheckCircle2 className="h-6 w-6 text-emerald-300" />

                  <h3 className="mt-4 text-lg font-semibold text-white">
                    {item.title}
                  </h3>

                  <p className="mt-3 leading-7 text-neutral-300">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">
            Funcionamiento
          </p>

          <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
            Un diagnóstico más útil empieza con buen contexto.
          </h2>

          <p className="mt-5 text-neutral-300">
            Un mismo ruido no significa lo mismo en un diésel antiguo que en un
            híbrido reciente. Por eso el sistema no solo escucha: también pregunta por el coche.
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
              icon: Search,
              title: "3. Recibe una orientación",
              text: "La IA devuelve posibles causas, urgencia, preguntas para afinar y pasos razonables antes de ir al taller.",
            },
          ].map((step) => (
            <div
              key={step.title}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6"
            >
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
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">
              Diagnóstico guiado
            </p>

            <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
              Analiza tu coche paso a paso.
            </h2>

            <p className="mt-5 leading-8 text-neutral-300">
              Hemos simplificado el proceso para que cualquier conductor pueda usarlo: primero
              identificas el vehículo, después marcas los síntomas, subes o grabas el audio y
              finalmente recibes una orientación clara con IA.
            </p>

            <div className="mt-8 rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
              <div className="flex gap-3">
                <ShieldAlert className="mt-1 h-5 w-5 shrink-0" />
                <p className="text-sm leading-6">
                  AutoSonar no sustituye a un mecánico. Si hay humo, pérdida de potencia,
                  olor a quemado, fallo de frenos, dirección rara o testigos encendidos,
                  conviene parar y revisar el coche cuanto antes.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-sm text-neutral-300">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <span>Flujo más claro para usuarios nuevos.</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <span>Más contexto para que la IA no responda a ciegas.</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <span>Resultado descargable en PDF para llevar al taller.</span>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-neutral-950 p-5 shadow-xl">
            <div className="grid gap-3 md:grid-cols-4">
              {diagnosticSteps.map((step) => {
                const isActive = currentStep === step.number;
                const isDone = currentStep > step.number;

                return (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => goToStep(step.number)}
                    className={`rounded-2xl border p-4 text-left transition ${isActive
                      ? "border-emerald-300/60 bg-emerald-300/10"
                      : isDone
                        ? "border-emerald-300/20 bg-white/[0.04]"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${isActive || isDone
                          ? "bg-emerald-300 text-neutral-950"
                          : "bg-white/10 text-neutral-300"
                          }`}
                      >
                        {isDone ? "✓" : step.number}
                      </span>
                      <span className="font-semibold text-white">{step.title}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-neutral-400">{step.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white p-3 text-neutral-950">
                      <Car className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Identifica tu vehículo</h3>
                      <p className="mt-1 text-sm leading-6 text-neutral-400">
                        Cuanto más concreto seas, mejor podrá razonar la IA. No es lo mismo un
                        diésel antiguo que un híbrido reciente.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm">
                      <span className="text-neutral-300">Marca</span>
                      <select
                        value={brand}
                        onChange={(event) => {
                          setBrand(event.target.value);
                          setAiResult(null);
                        }}
                        className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-white/40"
                      >
                        {brands.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-2 text-sm">
                      <span className="text-neutral-300">Modelo</span>
                      <input
                        value={model}
                        onChange={(event) => {
                          setModel(event.target.value);
                          setAiResult(null);
                        }}
                        className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-white/40"
                        placeholder="Ej. Golf"
                      />
                    </label>

                    <label className="grid gap-2 text-sm">
                      <span className="text-neutral-300">Año</span>
                      <input
                        value={year}
                        onChange={(event) => {
                          setYear(event.target.value);
                          setAiResult(null);
                        }}
                        className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-white/40"
                        placeholder="Ej. 2016"
                      />
                    </label>

                    <label className="grid gap-2 text-sm">
                      <span className="text-neutral-300">Motor</span>
                      <select
                        value={engine}
                        onChange={(event) => {
                          setEngine(event.target.value);
                          setAiResult(null);
                        }}
                        className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-white/40"
                      >
                        {engines.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white p-3 text-neutral-950">
                      <Search className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Cuéntanos cuándo aparece el ruido</h3>
                      <p className="mt-1 text-sm leading-6 text-neutral-400">
                        Marca síntomas rápidos y añade una descripción. Este contexto ayuda a evitar
                        diagnósticos demasiado genéricos.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-2 sm:grid-cols-2">
                    {quickSymptomOptions.map((symptom) => {
                      const selected = quickSymptoms.includes(symptom);

                      return (
                        <button
                          key={symptom}
                          type="button"
                          onClick={() => toggleQuickSymptom(symptom)}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${selected
                            ? "border-emerald-300/60 bg-emerald-300/10 text-emerald-100"
                            : "border-white/10 bg-neutral-900 text-neutral-300 hover:bg-white/[0.06]"
                            }`}
                        >
                          <span className="mr-2">{selected ? "✓" : "+"}</span>
                          {symptom}
                        </button>
                      );
                    })}
                  </div>

                  <label className="mt-5 grid gap-2 text-sm">
                    <span className="text-neutral-300">Descripción libre</span>
                    <textarea
                      value={situation}
                      onChange={(event) => {
                        setSituation(event.target.value);
                        setAiResult(null);
                      }}
                      className="min-h-28 rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-white/40"
                      placeholder="Ej. Suena en frío durante 30 segundos, sobre todo al arrancar y al girar el volante."
                    />
                  </label>

                  {diagnosticContext && (
                    <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-100">
                      <p className="font-semibold">Contexto que recibirá la IA:</p>
                      <p className="mt-1 whitespace-pre-line text-emerald-100/80">{diagnosticContext}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white p-3 text-neutral-950">
                      <Volume2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Sube o graba el sonido</h3>
                      <p className="mt-1 text-sm leading-6 text-neutral-400">
                        Lo ideal es un audio de 10 a 20 segundos, sin música, sin voces y con el móvil
                        cerca de la zona del ruido.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setMode("upload")}
                      className={`rounded-2xl border p-5 text-left transition ${mode === "upload"
                        ? "border-white bg-white text-neutral-950"
                        : "border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
                        }`}
                    >
                      <Upload className="mb-4 h-6 w-6" />
                      <p className="font-semibold">Subir audio</p>
                      <p className={`mt-1 text-sm ${mode === "upload" ? "text-neutral-600" : "text-neutral-400"}`}>
                        MP3, WAV, AAC, OGG, FLAC o AIFF
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("record")}
                      className={`rounded-2xl border p-5 text-left transition ${mode === "record"
                        ? "border-white bg-white text-neutral-950"
                        : "border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
                        }`}
                    >
                      <Mic className="mb-4 h-6 w-6" />
                      <p className="font-semibold">Usar micrófono</p>
                      <p className={`mt-1 text-sm ${mode === "record" ? "text-neutral-600" : "text-neutral-400"}`}>
                        Grabación convertida a WAV
                      </p>
                    </button>
                  </div>

                  {mode === "upload" && (
                    <label className="mt-5 block cursor-pointer rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-6 text-center transition hover:bg-white/[0.06]">
                      <Volume2 className="mx-auto h-8 w-8 text-neutral-300" />

                      <p className="mt-3 font-medium">
                        {audioFile ? audioFile.name : "Sube un audio del motor"}
                      </p>

                      <p className="mt-1 text-sm text-neutral-400">
                        Máximo {MAX_AUDIO_SIZE_MB} MB. Si puedes, graba en un entorno tranquilo.
                      </p>

                      <input
                        type="file"
                        accept=".mp3,.wav,.aac,.ogg,.flac,.aiff,.aif,audio/mpeg,audio/mp3,audio/wav,audio/aac,audio/ogg,audio/flac,audio/aiff"
                        onChange={handleAudioFileChange}
                        className="hidden"
                      />
                    </label>
                  )}

                  {mode === "record" && (
                    <div className="mt-5 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-6 text-center">
                      <Mic className="mx-auto h-8 w-8 text-neutral-300" />

                      <p className="mt-3 font-medium">
                        {isRecording
                          ? "Grabando audio del coche..."
                          : audioFile
                            ? audioFile.name
                            : "Graba el sonido del motor"}
                      </p>

                      <p className="mt-1 text-sm text-neutral-400">
                        Acerca el móvil a la zona del ruido sin tocar piezas calientes o móviles.
                      </p>

                      <div className="mt-4 flex justify-center">
                        {!isRecording ? (
                          <button
                            type="button"
                            onClick={startRecording}
                            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200"
                          >
                            <Mic className="mr-2 h-4 w-4" />
                            Empezar grabación
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="inline-flex items-center justify-center rounded-2xl bg-red-400 px-5 py-3 font-medium text-neutral-950 transition hover:bg-red-300"
                          >
                            <Square className="mr-2 h-4 w-4" />
                            Detener grabación
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {audioPreviewUrl && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="mb-2 text-sm text-neutral-300">Audio cargado:</p>
                      <audio controls src={audioPreviewUrl} className="w-full" />
                    </div>
                  )}
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white p-3 text-neutral-950">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Revisa y analiza</h3>
                      <p className="mt-1 text-sm leading-6 text-neutral-400">
                        Comprueba los datos antes de enviar el audio. El resultado será orientativo
                        y podrás descargarlo en PDF.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-neutral-900 p-4 text-sm text-neutral-300">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="text-neutral-400">Vehículo</span>
                      <strong className="text-white">{carSummary}</strong>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="text-neutral-400">Audio</span>
                      <strong className="text-white">{audioFile?.name || "No cargado"}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-400">Síntomas</span>
                      <p className="mt-1 whitespace-pre-line text-white">
                        {diagnosticContext || "No se han indicado síntomas adicionales."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={analyzeWithAI}
                    disabled={isAnalyzing || isRecording || !audioFile}
                    className="mt-5 flex w-full items-center justify-center rounded-2xl bg-emerald-400 px-5 py-4 font-semibold text-neutral-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analizando audio...
                      </>
                    ) : (
                      <>
                        Analizar sonido con IA
                        <Sparkles className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </button>

                  {!audioFile && (
                    <p className="mt-3 text-sm text-amber-200">
                      Todavía no has cargado ningún audio. Vuelve al paso 3 para subirlo o grabarlo.
                    </p>
                  )}

                  {isAnalyzing && <SonarSearching />}

                  {aiResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <div className="mb-4 flex items-center gap-2 text-sm text-neutral-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        Resultado IA para {carSummary}
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="font-semibold">Resumen</h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${urgencyBadgeClass(
                              aiResult.urgencia_general
                            )}`}
                          >
                            Urgencia: {aiResult.urgencia_general || "sin valorar"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-neutral-300">
                          {aiResult.resumen}
                        </p>

                        <p className="mt-3 text-xs text-neutral-400">
                          Calidad del audio: {aiResult.calidad_audio || "no indicada"}
                        </p>
                      </div>

                      <div className="mt-3 grid gap-3">
                        {aiResult.posibles_causas?.map((result, index) => (
                          <div
                            key={`${result.causa}-${index}`}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h3 className="font-semibold">{result.causa}</h3>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${urgencyBadgeClass(
                                  result.urgencia
                                )}`}
                              >
                                {result.confianza}% confianza · {result.urgencia}
                              </span>
                            </div>

                            <p className="mt-2 text-sm leading-6 text-neutral-300">
                              {result.explicacion}
                            </p>

                            <p className="mt-3 text-sm leading-6 text-emerald-200">
                              Qué hacer: {result.que_hacer}
                            </p>
                          </div>
                        ))}
                      </div>

                      {aiResult.preguntas_para_afinar?.length > 0 && (
                        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <h3 className="font-semibold">Preguntas para afinar</h3>

                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-300">
                            {aiResult.preguntas_para_afinar.map((question, index) => (
                              <li key={index}>{question}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
                        <p>{aiResult.recomendacion}</p>
                        <p className="mt-2 opacity-90">{aiResult.advertencia}</p>
                      </div>

                      <button
                        type="button"
                        onClick={downloadDiagnosisPdf}
                        className="mt-4 flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white px-5 py-4 font-semibold text-neutral-950 transition hover:bg-neutral-200"
                      >
                        <Download className="mr-2 h-5 w-5" />
                        Descargar informe PDF
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            {analyzeError && (
              <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">
                {analyzeError}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={currentStep === 1 || isAnalyzing}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Atrás
              </button>

              {currentStep < diagnosticSteps.length ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={isRecording || isAnalyzing}
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 font-semibold text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continuar
                  <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  disabled={isAnalyzing}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cambiar audio
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <DiagnosisHistory
        history={diagnosisHistory}
        onClearHistory={clearDiagnosisHistory}
        formatDate={formatHistoryDate}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-purple-300">
              Roadmap
            </p>

            <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
              De web a app completa.
            </h2>
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
              <div
                key={item}
                className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <p className="text-neutral-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-purple-300">
            Planes futuros
          </p>

          <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
            Pensado para crecer de demo a producto real.
          </h2>

          <p className="mt-5 leading-8 text-neutral-300">
            AutoSonar nace como una herramienta gratuita de diagnóstico orientativo,
            pero está preparado para evolucionar hacia cuentas de usuario, historial,
            informes avanzados y soluciones para talleres.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-400">
                    {plan.description}
                  </p>
                </div>

                <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  {plan.price}
                </span>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-neutral-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-semibold text-white">
                ¿Tu coche hace un ruido raro?
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-emerald-100/80">
                Grábalo ahora y recibe una orientación en segundos. Puede que no sea
                nada grave, o puede que merezca una revisión antes de que vaya a más.
              </p>
            </div>

            <a
              href="#diagnostico"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 font-semibold text-neutral-950 transition hover:bg-neutral-200"
            >
              Empezar diagnóstico
              <ChevronRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="mt-8 flex gap-3 rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Para evitar problemas legales y de confianza, los resultados deben decir
            “posible causa” y no “diagnóstico definitivo”. La app debe recomendar taller
            si detecta riesgo alto.
          </p>
        </div>
      </section>

      <CopyrightFooter />
      <LegalNotice />
    </main>
  );
}
