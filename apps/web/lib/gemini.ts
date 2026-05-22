import { GoogleGenAI } from '@google/genai';

const g = globalThis as unknown as { __genai?: GoogleGenAI };

export const ai: GoogleGenAI =
  g.__genai ??
  (g.__genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY }));

export const MODEL_NL = 'gemini-3.1-pro-preview';
export const MODEL_EMBED = 'gemini-embedding-001';
export const EMBED_DIM = 1024;

export async function generateJson<T>(
  prompt: string,
  responseSchema: any,
  opts?: { system?: string },
): Promise<T> {
  const res = await ai.models.generateContent({
    model: MODEL_NL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      ...(opts?.system ? { systemInstruction: opts.system } : {}),
    },
  });
  const text = (res as any).text ?? '';
  return JSON.parse(text) as T;
}

export async function embedText(text: string): Promise<number[]> {
  const res: any = await ai.models.embedContent({
    model: MODEL_EMBED,
    contents: text,
    config: { outputDimensionality: EMBED_DIM },
  });
  const values: number[] | undefined =
    res?.embeddings?.[0]?.values ?? res?.embedding?.values;
  if (!values) throw new Error('embedText: no embedding returned');
  return values;
}
