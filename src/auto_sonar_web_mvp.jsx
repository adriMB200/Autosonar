import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Square,
  Loader2,
} from "lucide-react";

const MAX_AUDIO_SIZE_MB = 5;
const MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024;

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

function getSupportedAudioMimeType(file) {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (type === "audio/wav" || type === "audio/x-wav" || name.endsWith(".wav")) {
    return "audio/wav";
  }

  if (
    type === "audio/mpeg" ||
    type === "audio/mp3" ||
    name.endsWith(".mp3")
  ) {
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
            0% {
              transform: scale(0.25);
              opacity: 0.9;
            }
            75% {
              opacity: 0.18;
            }
            100% {
              transform: scale(1);
              opacity: 0;
            }
          }

          @keyframes autosonarSweep {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes autosonarDot {
            0%, 100% {
              opacity: 0.35;
              transform: scale(0.8);
            }
            50% {
              opacity: 1;
              transform: scale(1.15);
            }
          }

          @keyframes autosonarText {
            0%, 100% {
              opacity: 0.55;
            }
            50% {
              opacity: 1;
            }
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

          <div className="absolute left-1/2 top-1/2 h-px w-1/2 origin-left bg-gradient-to-r from-emerald-300 via-emerald-300/70 to-transparent" style={{ animation: "autosonarSweep 1.7s linear infinite" }} />

          <div className="absolute left-[62%] top-[30%] h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-lg shadow-emerald-300/60" style={{ animation: "autosonarDot 1.4s ease-in-out infinite" }} />
          <div className="absolute left-[31%] top-[58%] h-2 w-2 rounded-full bg-emerald-200 shadow-lg shadow-emerald-300/60" style={{ animation: "autosonarDot 1.8s ease-in-out infinite" }} />
          <div className="absolute left-[70%] top-[66%] h-1.5 w-1.5 rounded-full bg-emerald-100 shadow-lg shadow-emerald-300/60" style={{ animation: "autosonarDot 1.2s ease-in-out infinite" }} />

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

  if (cookieChoice) {
    return null;
  }

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
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
              <h3 className="text-lg font-semibold text-white">
                Autoría, titularidad y derechos de propiedad intelectual
              </h3>

              <p className="mt-3">
                Esta web, denominada provisionalmente <strong>AutoSonar</strong>, ha sido
                creada por <strong>Ramiro</strong>, autor del proyecto, del concepto web,
                de la estructura funcional, del diseño inicial, de los textos y de la
                implementación de la plataforma.
              </p>

              <p className="mt-3">
                Salvo que se indique lo contrario, todos los elementos originales de esta
                web, incluyendo su código propio, diseño, organización de contenidos,
                textos, selección de funcionalidades, nombre del proyecto, experiencia de
                usuario y planteamiento de diagnóstico acústico aplicado a vehículos,
                pertenecen a su autor.
              </p>

              <p className="mt-3">
                Queda expresamente prohibida la copia, reproducción, distribución,
                modificación, publicación, cesión, venta, transformación o explotación
                comercial no autorizada de AutoSonar o de cualquiera de sus elementos
                originales.
              </p>

              <p className="mt-3">
                El uso de librerías, modelos de inteligencia artificial, iconos, APIs,
                servicios externos o tecnologías de terceros no implica cesión alguna sobre
                los elementos originales creados para AutoSonar. Dichos recursos pertenecen
                a sus respectivos titulares y se utilizan conforme a sus propias licencias
                o condiciones.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-red-300/20 bg-red-300/10 p-6 text-red-100">
              <h3 className="text-lg font-semibold text-white">
                Prohibición de plagio o uso no autorizado
              </h3>

              <p className="mt-3">
                AutoSonar es un proyecto original desarrollado como herramienta de análisis
                acústico orientativo para vehículos. No se autoriza a terceros a copiar la
                web, replicar su presentación, reutilizar sus textos, apropiarse de su
                identidad, clonar su estructura visual o presentarla como un desarrollo
                propio.
              </p>

              <p className="mt-3">
                Cualquier uso no autorizado podrá ser considerado una vulneración de los
                derechos del autor sobre la obra concreta, sin perjuicio de otras acciones
                que pudieran corresponder conforme a la normativa aplicable.
              </p>
            </div>

            <p className="mt-3">
              Esta web, denominada provisionalmente <strong>AutoSonar</strong>,
              ha sido creada por <strong>AdriMB200</strong>, https://github.com/adriMB200
            </p>

            <p className="mt-3">
              Salvo que se indique lo contrario, los textos, estructura,
              diseño y elementos propios de AutoSonar pertenecen a su autor. Las
              librerías, servicios externos, modelos de inteligencia artificial,
              iconos o tecnologías de terceros pertenecen a sus respectivos
              titulares.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-6 text-amber-100">
            <h3 className="text-lg font-semibold text-white">
              Uso orientativo de los diagnósticos
            </h3>

            <p className="mt-3">
              Los resultados generados por AutoSonar son únicamente una
              orientación basada en el audio enviado, los datos del vehículo y
              el análisis realizado mediante inteligencia artificial. No deben
              considerarse un diagnóstico definitivo ni sustituyen la revisión
              de un mecánico profesional.
            </p>

            <p className="mt-3">
              El usuario entiende que un mismo ruido puede tener varias causas,
              que la calidad del audio puede afectar al resultado y que la IA
              puede cometer errores, omitir información o interpretar el sonido
              de forma incorrecta.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-red-300/20 bg-red-300/10 p-6 text-red-100">
            <h3 className="text-lg font-semibold text-white">
              Exención de responsabilidad
            </h3>

            <p className="mt-3">
              El autor de esta web no se hace responsable, en la medida permitida
              por la ley, de daños, averías, accidentes, pérdidas económicas,
              decisiones de reparación, uso indebido del vehículo o cualquier
              consecuencia derivada de seguir, interpretar o aplicar los
              diagnósticos generados por AutoSonar.
            </p>

            <p className="mt-3">
              Si el vehículo presenta síntomas graves como pérdida de potencia,
              humo, olor a quemado, testigos encendidos, fallo de frenos,
              dirección anómala, golpes fuertes o riesgo para la circulación, el
              usuario debe dejar de circular si es necesario y consultar con un
              taller o servicio de asistencia profesional.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold text-white">
              Tratamiento de audios y datos introducidos
            </h3>

            <p className="mt-3">
              Para realizar el análisis, el usuario puede enviar un archivo de
              audio o grabar sonido desde el micrófono, junto con datos como
              marca, modelo, año, motor y descripción del síntoma. Esta
              información se utiliza para generar una respuesta orientativa.
            </p>

            <p className="mt-3">
              No subas audios que contengan conversaciones privadas, datos
              personales sensibles o información que no quieras compartir con los
              servicios técnicos necesarios para procesar el diagnóstico.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold text-white">
              Cookies y almacenamiento local
            </h3>

            <p className="mt-3">
              AutoSonar puede utilizar cookies técnicas o almacenamiento local
              del navegador para recordar preferencias básicas, como la decisión
              sobre el aviso de cookies. En esta versión no se utilizan cookies
              publicitarias ni de seguimiento avanzado.
            </p>

            <p className="mt-3">
              Si en el futuro se añaden herramientas de analítica, publicidad o
              servicios de terceros que utilicen cookies no técnicas, se deberá
              actualizar este aviso y solicitar el consentimiento correspondiente.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
            <h3 className="text-lg font-semibold text-white">
              Aceptación de las condiciones
            </h3>

            <p className="mt-3">
              Al utilizar AutoSonar, el usuario acepta que la herramienta tiene
              carácter experimental y orientativo. La decisión final sobre el
              estado del vehículo, su reparación o su uso en carretera debe ser
              tomada por el usuario y, cuando corresponda, por un profesional
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

function CopyrightFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-neutral-950 px-6 py-10 text-center lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-neutral-300">
          © {year} AutoSonar · Proyecto, concepto, diseño, textos e implementación
          desarrollados por <strong className="text-white">Ramiro</strong>.
          Todos los derechos reservados.
        </p>

        <p className="mt-3 text-xs leading-6 text-neutral-500">
          Queda prohibida la copia, reproducción, distribución, modificación,
          publicación o explotación comercial no autorizada de esta web, su código,
          diseño, textos, estructura, marca, nombre del proyecto o cualquier elemento
          original propio de AutoSonar.
        </p>
      </div>
    </footer>
  );
}

export default function AutoSonarLanding() {
  const [mode, setMode] = useState("upload");
  const [brand, setBrand] = useState("Volkswagen");
  const [model, setModel] = useState("Golf");
  const [year, setYear] = useState("2016");
  const [engine, setEngine] = useState("Diésel");
  const [situation, setSituation] = useState("");

  const [audioFile, setAudioFile] = useState(null);
  const [audioMimeType, setAudioMimeType] = useState("");
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const carSummary = useMemo(() => {
    return `${brand} ${model || "modelo"} · ${year || "año"} · ${engine}`;
  }, [brand, model, year, engine]);

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
      setAnalyzeError(
        "Formato no válido. Usa MP3, WAV, AAC, OGG, FLAC o AIFF."
      );
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

  async function analyzeWithAI() {
    try {
      setAnalyzeError("");
      setAiResult(null);

      if (!audioFile || !audioMimeType) {
        setAnalyzeError("Primero sube un audio o graba desde el micrófono.");
        return;
      }

      if (audioFile.size > MAX_AUDIO_SIZE_BYTES) {
        setAnalyzeError(
          `El audio pesa demasiado. Usa un archivo de menos de ${MAX_AUDIO_SIZE_MB} MB.`
        );
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
          situation,
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
    } catch (error) {
      setAnalyzeError(error.message || "Error analizando el audio con IA.");
    } finally {
      setIsAnalyzing(false);
    }
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
              <Volume2 className="h-4 w-4" />
              Diagnóstico acústico para coches
            </div>

            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
              Analiza con IA el sonido de tu coche y orienta su diagnóstico
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
              Sube un audio o graba desde el micrófono. La herramienta analiza
              el patrón del sonido y cruza la información con marca, modelo, año
              y motor para orientar un posible diagnóstico.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#diagnostico"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 font-medium text-neutral-950 shadow-lg shadow-white/10 transition hover:bg-neutral-200"
              >
                Probar diagnóstico con IA
                <ChevronRight className="ml-2 h-4 w-4" />
              </a>

              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-medium text-white transition hover:bg-white/10"
              >
                Ver cómo funciona
              </a>
            </div>

            <p className="mt-5 text-sm text-neutral-400">
              MVP real: primero análisis orientativo con Gemini, después modelo
              especializado entrenado con audios de coches.
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

      <section
        id="como-funciona"
        className="mx-auto max-w-7xl px-6 py-20 lg:px-8"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">
            Funcionamiento
          </p>

          <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
            Un diagnóstico más útil empieza con buen contexto.
          </h2>

          <p className="mt-5 text-neutral-300">
            Un mismo ruido no significa lo mismo en un diésel antiguo que en un
            híbrido reciente. Por eso el sistema no solo escucha: también
            pregunta por el coche.
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
              Diagnóstico con IA
            </p>

            <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
              Prueba de diagnóstico
            </h2>

            <p className="mt-5 leading-8 text-neutral-300">
              Esta primera versión usa Gemini para escuchar el audio y razonar
              con los datos del coche. Puede orientar bastante, aunque no debe
              tratarse como una confirmación definitiva.
            </p>

            <div className="mt-8 rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-5 text-amber-100">
              <div className="flex gap-3">
                <ShieldAlert className="mt-1 h-5 w-5 shrink-0" />
                <p className="text-sm leading-6">
                  La herramienta no sustituye a un mecánico. Si hay humo,
                  pérdida de potencia, olor a quemado, fallo de frenos,
                  dirección rara o testigos encendidos, conviene parar y revisar
                  el coche cuanto antes.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-neutral-950 p-5 shadow-xl">
            <div className="grid gap-4 md:grid-cols-2">
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
                <p
                  className={`mt-1 text-sm ${mode === "upload" ? "text-neutral-600" : "text-neutral-400"
                    }`}
                >
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
                <p
                  className={`mt-1 text-sm ${mode === "record" ? "text-neutral-600" : "text-neutral-400"
                    }`}
                >
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
                  Ideal: 10 a 20 segundos, sin música ni viento fuerte. Máximo{" "}
                  {MAX_AUDIO_SIZE_MB} MB.
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
                  Graba unos 10-20 segundos. Acerca el móvil a la zona del ruido
                  sin tocar piezas calientes o móviles.
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

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="text-neutral-300">Marca</span>
                <select
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
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
                  onChange={(event) => setModel(event.target.value)}
                  className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-white/40"
                  placeholder="Ej. Golf"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-neutral-300">Año</span>
                <input
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-white/40"
                  placeholder="Ej. 2016"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-neutral-300">Motor</span>
                <select
                  value={engine}
                  onChange={(event) => setEngine(event.target.value)}
                  className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-white/40"
                >
                  {engines.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 grid gap-2 text-sm">
              <span className="text-neutral-300">
                ¿Cuándo aparece el ruido?
              </span>

              <textarea
                value={situation}
                onChange={(event) => setSituation(event.target.value)}
                className="min-h-24 rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white outline-none focus:border-white/40"
                placeholder="Ej. Suena en frío durante 30 segundos, sobre todo al arrancar y al girar el volante."
              />
            </label>

            <button
              type="button"
              onClick={analyzeWithAI}
              disabled={isAnalyzing || isRecording}
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

            {isAnalyzing && <SonarSearching />}

            {analyzeError && (
              <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">
                {analyzeError}
              </div>
            )}

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
              </motion.div>
            )}
          </div>
        </div>
      </section>

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

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 md:p-10">
          <div className="mt-8 flex gap-3 rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Para evitar problemas legales y de confianza, los resultados deben
              decir “posible causa” y no “diagnóstico definitivo”. La app debe
              recomendar taller si detecta riesgo alto.
            </p>
          </div>
        </div>
      </section>
      <LegalNotice />
    </main>
  );


}