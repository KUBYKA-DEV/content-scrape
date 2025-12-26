
import { GoogleGenAI, Type } from "@google/genai";
import { HookType, ToneType, Platform } from "../types";

export const generateHooks = async (
  content: string,
  type: HookType,
  tone: ToneType,
  platform: Platform
): Promise<string[]> => {
  // Always use new GoogleGenAI({ apiKey: process.env.API_KEY })
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Actúa como un experto en copy y redes sociales. Transforma el siguiente contenido en 3 variantes de "Hooks" impactantes.
    
    TIPO DE HOOK: ${type}
    TONO: ${tone}
    PLATAFORMA DESTINO: ${platform}
    
    CONTENIDO DE ORIGEN:
    """
    ${content}
    """
    
    Reglas:
    - Mantén el idioma original (español si es posible).
    - El hook debe ser la primera oración para detener el scroll.
    - Adaptado estrictamente al formato de ${platform}.
    - Devuelve exactamente 3 opciones en formato de lista JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      },
    });

    // Use .text property directly
    const result = JSON.parse(response.text || '[]');
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error generating hooks:", error);
    return ["Error al generar hooks. Revisa tu conexión."];
  }
};
