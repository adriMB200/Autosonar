function jsonResponse(statusCode, data) {
    return {
        statusCode,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };
}

function extractJson(text) {
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/\{[\s\S]*\}/);

        if (!match) return null;

        try {
            return JSON.parse(match[0]);
        } catch {
            return null;
        }
    }
}

function normalizeMimeType(mimeType) {
    if (mimeType === "audio/mpeg") return "audio/mp3";
    if (mimeType === "audio/x-wav") return "audio/wav";
    if (mimeType === "audio/x-aiff") return "audio/aiff";
    return mimeType;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractGroundingSources(data) {
    const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return chunks
        .map((chunk) => {
            const web = chunk.web;
            if (!web?.uri) return null;

            return {
                title: web.title || "Fuente consultada",
                url: web.uri,
            };
        })
        .filter(Boolean)
        .slice(0, 5);
}

async function callGemini({
    apiKey,
    modelName,
    prompt,
    audioBase64,
    normalizedMimeType,
}) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: prompt,
                            },
                            {
                                inlineData: {
                                    mimeType: normalizedMimeType,
                                    data: audioBase64,
                                },
                            },
                        ],
                    },
                ],

                generationConfig: {
                    temperature: 0.1,
                },
            }),
        }
    );

    const data = await response.json();

    return {
        ok: response.ok,
        status: response.status,
        data,
    };
}

export async function handler(event) {
    try {
        if (event.httpMethod !== "POST") {
            return jsonResponse(405, {
                error: "Método no permitido",
            });
        }

        const apiKey =
            process.env.AutosonarAPIKEY ||
            process.env.AutosonarAPIKEy ||
            process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return jsonResponse(500, {
                error:
                    "Falta la variable AutosonarAPIKEY en Netlify. Revisa que esté en Environment variables.",
            });
        }

        const body = JSON.parse(event.body || "{}");

        const {
            brand,
            model,
            year,
            engine,
            situation,
            audioBase64,
            audioMimeType,
        } = body;

        if (!audioBase64) {
            return jsonResponse(400, {
                error: "Falta el audio en base64",
            });
        }

        const normalizedMimeType = normalizeMimeType(audioMimeType);

        const allowedMimeTypes = [
            "audio/wav",
            "audio/mp3",
            "audio/aiff",
            "audio/aac",
            "audio/ogg",
            "audio/flac",
        ];

        if (!allowedMimeTypes.includes(normalizedMimeType)) {
            return jsonResponse(400, {
                error:
                    "Formato de audio no válido. Usa MP3, WAV, AAC, OGG, FLAC o AIFF.",
            });
        }

        const vehicle = `${brand || "marca no indicada"} ${model || "modelo no indicado"} ${year || "año no indicado"} ${engine || "motor no indicado"}`;

        const prompt = `
Eres AutoSonar, un mecánico experto especializado en diagnóstico acústico de coches.

Actúa como un mecánico con experiencia real en:
- ruidos de motor,
- correas,
- poleas,
- tensores,
- rodamientos,
- inyectores,
- embrague,
- caja de cambios,
- frenos,
- suspensión,
- dirección,
- escape,
- arranque,
- vibraciones y sonidos metálicos.

Tu tarea:
1. Escucha el audio.
2. Analiza el patrón del sonido: tono, repetición, vibración, golpes, chirridos, silbidos, traqueteos o rozamientos.
3. Usa los datos del coche para buscar información relacionada con diagnósticos por ruido en ese vehículo o en motores similares.
4. Compara el sonido con problemas habituales documentados para ese coche, motor o familia mecánica.
5. Si NO encuentras una coincidencia razonable o el audio no permite identificar el ruido, dilo claramente.

Vehículo:
${vehicle}

Datos concretos:
- Marca: ${brand || "No indicada"}
- Modelo: ${model || "No indicado"}
- Año: ${year || "No indicado"}
- Motor: ${engine || "No indicado"}

Síntomas indicados por el usuario:
${situation || "No indicado"}

Normas estrictas:
- No des un diagnóstico definitivo.
- No inventes averías concretas si no hay una base razonable.
- No rellenes causas por rellenar.
- Si el sonido no se puede identificar, responde: "Sonido no identificado. Por favor, indique algún síntoma más para afinar el diagnóstico."
- Si no encuentras información útil sobre ese coche/motor/ruido, dilo.
- Si el audio es malo, con viento, música, voces o demasiado corto, dilo.
- Usa lenguaje de mecánico, pero entendible para alguien sin conocimientos.
- Da prioridad a seguridad: frenos, dirección, humo, olor a quemado, pérdida de potencia, testigos encendidos o golpes fuertes.
- Recomienda taller si el riesgo es medio o alto.
- Responde SOLO con JSON válido. No uses markdown. No añadas texto fuera del JSON.

Criterio de identificación:
- Solo marca "sonido_identificado": true si hay una coincidencia razonable entre audio + vehículo + síntomas + información encontrada.
- Si dudas bastante, usa "sonido_identificado": false.
- La confianza debe ser conservadora. No pongas 80 o más salvo que el patrón sea muy claro.

Formato exacto:
{
  "sonido_identificado": true,
  "resumen": "string",
  "calidad_audio": "buena | regular | mala",
  "urgencia_general": "baja | media | alta",
  "posibles_causas": [
    {
      "causa": "string",
      "confianza": 0,
      "urgencia": "baja | media | alta",
      "explicacion": "string",
      "que_hacer": "string"
    }
  ],
  "informacion_encontrada": "string",
  "preguntas_para_afinar": ["string"],
  "recomendacion": "string",
  "advertencia": "string"
}

Si no identificas el sonido, usa exactamente este tipo de respuesta:
{
  "sonido_identificado": false,
  "resumen": "Sonido no identificado. Por favor, indique algún síntoma más para afinar el diagnóstico.",
  "calidad_audio": "regular",
  "urgencia_general": "media",
  "posibles_causas": [],
  "informacion_encontrada": "No se ha encontrado una coincidencia suficientemente fiable entre el audio, el vehículo y los síntomas indicados.",
  "preguntas_para_afinar": [
    "¿El ruido aparece en frío o en caliente?",
    "¿Aumenta al acelerar?",
    "¿Se escucha al frenar, girar, arrancar o cambiar de marcha?",
    "¿Hay testigos encendidos en el cuadro?",
    "¿Notas pérdida de potencia, humo u olor a quemado?"
  ],
  "recomendacion": "Graba otro audio de 10 a 20 segundos cerca de la zona donde se escucha el ruido e indica cuándo aparece.",
  "advertencia": "Si hay pérdida de potencia, humo, olor a quemado, problemas de freno o dirección, no sigas circulando y consulta con un taller."
}
`;

        const modelsToTry = [
            process.env.GEMINI_MODEL,
            "gemini-2.5-flash-lite",
        ].filter(Boolean);

        let lastError = null;

        for (const modelName of modelsToTry) {
            for (let attempt = 1; attempt <= 2; attempt += 1) {
                const result = await callGemini({
                    apiKey,
                    modelName,
                    prompt,
                    audioBase64,
                    normalizedMimeType,
                });

                if (result.ok) {
                    const text =
                        result.data?.candidates?.[0]?.content?.parts
                            ?.map((part) => part.text || "")
                            .join("") || "";

                    const parsed = extractJson(text);
                    const sources = extractGroundingSources(result.data);

                    if (!parsed) {
                        return jsonResponse(200, {
                            result: {
                                sonido_identificado: false,
                                resumen:
                                    "Sonido no identificado. Por favor, indique algún síntoma más para afinar el diagnóstico.",
                                calidad_audio: "regular",
                                urgencia_general: "media",
                                posibles_causas: [],
                                informacion_encontrada:
                                    "La IA respondió, pero no devolvió un resultado estructurado fiable.",
                                preguntas_para_afinar: [
                                    "¿El ruido aparece en frío o en caliente?",
                                    "¿Aumenta al acelerar?",
                                    "¿Se escucha al frenar, girar, arrancar o cambiar de marcha?",
                                    "¿Hay testigos encendidos en el cuadro?",
                                    "¿Notas pérdida de potencia, humo u olor a quemado?",
                                ],
                                recomendacion:
                                    "Prueba con otro audio de 10 a 20 segundos, grabado cerca de la zona donde aparece el ruido.",
                                advertencia:
                                    "Si hay pérdida de potencia, humo, olor a quemado, testigos encendidos o problemas de freno/dirección, acude a un taller.",
                                fuentes_consultadas: sources,
                            },
                            raw: text,
                            model_used: modelName,
                        });
                    }

                    return jsonResponse(200, {
                        result: {
                            sonido_identificado:
                                typeof parsed.sonido_identificado === "boolean"
                                    ? parsed.sonido_identificado
                                    : true,
                            resumen:
                                parsed.resumen ||
                                "Sonido no identificado. Por favor, indique algún síntoma más para afinar el diagnóstico.",
                            calidad_audio: parsed.calidad_audio || "regular",
                            urgencia_general: parsed.urgencia_general || "media",
                            posibles_causas: Array.isArray(parsed.posibles_causas)
                                ? parsed.posibles_causas
                                : [],
                            informacion_encontrada:
                                parsed.informacion_encontrada ||
                                "No se ha podido confirmar información específica suficiente.",
                            preguntas_para_afinar: Array.isArray(parsed.preguntas_para_afinar)
                                ? parsed.preguntas_para_afinar
                                : [
                                    "¿El ruido aparece en frío o en caliente?",
                                    "¿Aumenta al acelerar?",
                                    "¿Se escucha al frenar, girar, arrancar o cambiar de marcha?",
                                ],
                            recomendacion:
                                parsed.recomendacion ||
                                "Graba otro audio más claro e indica cuándo aparece el ruido.",
                            advertencia:
                                parsed.advertencia ||
                                "Si hay síntomas graves, consulta con un taller antes de seguir circulando.",
                            fuentes_consultadas: sources,
                        },
                        model_used: modelName,
                    });
                }

                lastError = result.data;

                const isTemporary =
                    result.status === 429 ||
                    result.status === 500 ||
                    result.status === 502 ||
                    result.status === 503 ||
                    result.status === 504;

                console.error(
                    `Gemini error with ${modelName}, attempt ${attempt}:`,
                    JSON.stringify(result.data, null, 2)
                );

                if (!isTemporary) {
                    break;
                }

                await sleep(900 * attempt);
            }
        }

        return jsonResponse(503, {
            error:
                "Gemini está saturado ahora mismo. Hemos probado varios modelos, pero todos han fallado temporalmente.",
            details:
                lastError?.error?.message ||
                lastError?.error ||
                "Error temporal de disponibilidad.",
        });
    } catch (error) {
        console.error("Error analyze-audio:", error);

        return jsonResponse(500, {
            error: "Error analizando el audio",
            details: error.message,
        });
    }
}