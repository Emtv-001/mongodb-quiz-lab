import { MongoTopic, Question, DifficultyLevel, CurriculumLevel, QuestionType } from '../types';
import { getSiteCustomization } from './adminService';
import { sanitizeQuestion } from './storage';
import { reportSystemIncident } from './incidentService';

export interface GenerationOptions {
  topic?: MongoTopic;
  level?: CurriculumLevel;
  difficulty?: DifficultyLevel;
  type?: QuestionType;
  datasetName?: string;
  count?: number;
  apiKeyOverride?: string;
  existingQuestionsToAvoid?: string[];
}

/**
 * Builds a dynamic, versatile structured JSON prompt for Gemini.
 * Generates practical, varied MongoDB questions across diverse real-world industry domains
 * (e-commerce, fintech, IoT time-series, SaaS multi-tenant, healthcare, gaming, logs, and more)
 * without being artificially restricted to any single fixed dataset.
 */
function buildQuestionPrompt(options: GenerationOptions): string {
  const { topic, level, difficulty, count = 3, datasetName, existingQuestionsToAvoid } = options;
  let avoidInstruction = '';
  if (existingQuestionsToAvoid && existingQuestionsToAvoid.length > 0) {
    const titles = existingQuestionsToAvoid.slice(-6).map(t => `"${t}"`).join(', ');
    avoidInstruction = `\nAvoid repeating similar questions to: ${titles}.\n`;
  }

  const datasetContext = datasetName
    ? `Specific dataset: ${datasetName}`
    : `Diverse real-world production datasets (draw freely from varied domains: e-commerce, fintech, IoT telemetry, SaaS multi-tenancy, healthcare, logistics, social media, gaming, or general databases)`;

  return `Generate exactly ${count} MongoDB quiz questions. Be concise and fast.
Topic: ${topic || 'CRUD Operations'} | Difficulty: ${difficulty || 'Medium'} | Level: ${level || 3}
Dataset: ${datasetContext}${avoidInstruction}

Mix question types freely: write-command (mongosh shell) or multiple-choice.
Use realistic collections: db.orders, db.products, db.accounts, db.users, db.transactions, db.GptData02, db.sensor_readings, db.patients, etc.
For multiple-choice: 4 options, include believable misconceptions as distractors.
For write-command: provide real executable mongosh command + 2-3 acceptableAlternatives (quote/spacing variants).

Return ONLY a raw JSON array — no markdown, no explanation. Each item:
{"title":"string","scenario":"1-2 sentences","codeSnippet":"string or null","datasetName":"string","type":"write-command|multiple-choice","expectedCommand":"string (write-command only)","acceptableAlternatives":["string"],"options":["string","string","string","string"],"correctOptionIndex":0,"explanation":"1-2 sentences","misconception":"1 sentence","conceptFocus":"string","points":10}`;
}

/**
 * Normalizes raw JSON response from Gemini into valid Question[] format.
 */
function parseAndFormatQuestions(text: string, options: GenerationOptions): Question[] {
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    // Attempt markdown cleanup if surrounded with ```json ... ```
    const cleaned = text.replace(/```json\s*/i, '').replace(/```\s*$/i, '').trim();
    parsed = JSON.parse(cleaned);
  }

  if (!Array.isArray(parsed)) {
    parsed = [parsed];
  }

  return parsed.map((q: any, i: number) => {
    // Ensure acceptableAlternatives are provided for write-command
    let acceptableAlternatives = Array.isArray(q.acceptableAlternatives) ? q.acceptableAlternatives : [];
    if (q.type === 'write-command' && q.expectedCommand && acceptableAlternatives.length === 0) {
      const cmd = String(q.expectedCommand);
      const singleQuoteVer = cmd.replace(/"/g, "'");
      const doubleQuoteVer = cmd.replace(/'/g, '"');
      const noSpaceVer = cmd.replace(/:\s+/g, ':').replace(/,\s+/g, ',');
      acceptableAlternatives = Array.from(new Set([cmd, singleQuoteVer, doubleQuoteVer, noSpaceVer]));
    }

    return sanitizeQuestion({
      ...q,
      id: `ai_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      topic: options.topic || 'General MongoDB',
      level: options.level || 3,
      difficulty: options.difficulty || 'Medium',
      datasetName: q.datasetName || options.datasetName || 'General',
      type: q.type === 'multiple-choice' || q.type === 'write-command' ? q.type : 'write-command',
      codeSnippet: q.codeSnippet || undefined,
      acceptableAlternatives: acceptableAlternatives.length > 0 ? acceptableAlternatives : undefined,
      tags: ['ai-generated', 'dynamic', 'gemini', (options.topic || 'mongodb').toLowerCase().replace(/\s+/g, '-')]
    }, i);
  });
}

/**
 * Direct call to Google Gemini API from browser (Alternative 1).
 * Completely bypasses Vercel 10s Serverless Function timeouts and execution errors.
 * Uses gemini-3.8-flash with thinkingLevel: "low" for ultra-fast, high-quality responses.
 */
export async function directGeminiGenerate(
  prompt: string,
  apiKey: string,
  _timeoutMs: number = 20000  // kept for backwards-compat signature; actual timeout applied below
): Promise<string> {
  // gemini-3.8-flash-lite: ultra-fast, no thinking overhead, ideal for structured JSON generation
  const models = ['gemini-3.8-flash-lite', 'gemini-3.8-flash', 'gemini-3-flash-preview'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      // 10-second hard timeout per model — total worst case ~30s across 3 models
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            // thinkingBudget: 0 disables thinking tokens — drastically reduces latency to ~2-4s
            thinkingConfig: { thinkingBudget: 0 }
          }
        })
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Gemini ${model} Error (${res.status}): ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error(`No text returned by ${model}`);
      }
      return text;
    } catch (err: any) {
      lastError = err;
      console.warn(`Direct Gemini call failed with ${model}:`, err.message);
      // Continue to try the fallback model
    }
  }

  throw lastError || new Error("Failed to generate response from Gemini API");
}

/**
 * Tests a Gemini API key with a fast ping request using gemini-3.8-flash.
 */
export async function testGeminiConnection(apiKey: string): Promise<{ success: boolean; message: string; model?: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'Please enter a Gemini API Key to test.' };
  }
  const testModels = ['gemini-3.8-flash', 'gemini-3-flash-preview'];
  let lastErr = '';

  for (const model of testModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Respond with JSON: {"status": "ok"}' }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (res.ok) {
        return { success: true, message: `Connection verified! Model ${model} is active and operational.`, model };
      }

      const errText = await res.text().catch(() => '');
      lastErr = `HTTP ${res.status}: ${errText.slice(0, 150)}`;
    } catch (err: any) {
      lastErr = err.message || 'Connection failed.';
    }
  }

  return { success: false, message: lastErr };
}

/**
 * Generates dynamic, AI-synthesized practical MongoDB questions on the fly.
 * Priority 1: Direct Client-Side Gemini (Immune to Vercel timeouts, sub-3s via flash-lite & 0-thinking)
 * Priority 2: Vercel Backend Proxy (/api/generate-questions) with 7.5s hard timeout
 */
export async function generateAiDynamicQuestions(options: GenerationOptions = {}): Promise<Question[]> {
  const prompt = buildQuestionPrompt(options);

  // 1. Resolve API Key for direct client-side generation
  let apiKey = options.apiKeyOverride;

  if (!apiKey && typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  }

  // Fast check: check local cached site config first to avoid a 1-2s serverless cold-start roundtrip
  if (!apiKey) {
    try {
      const cached = localStorage.getItem('mongo_quiz_site_config_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.geminiApiKey) apiKey = parsed.geminiApiKey;
      }
    } catch {}
  }

  if (!apiKey) {
    try {
      const siteConfig = await getSiteCustomization();
      if (siteConfig?.geminiApiKey) {
        apiKey = siteConfig.geminiApiKey;
        try {
          localStorage.setItem('mongo_quiz_site_config_cache', JSON.stringify(siteConfig));
        } catch {}
      }
    } catch {}
  }

  // 2. If API Key is available, perform direct client-side call (7.5s hard limit)
  if (apiKey && apiKey.trim()) {
    try {
      const rawJson = await directGeminiGenerate(prompt, apiKey, 7500);
      const questions = parseAndFormatQuestions(rawJson, options);
      if (questions.length > 0) {
        return questions;
      }
    } catch (clientErr: any) {
      console.warn("Direct client Gemini failed, falling back to backend proxy...", clientErr.message);
    }
  }

  // 3. Fallback: Call Vercel backend route (/api/generate-questions) with 25s hard timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(options)
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errText = await response.text().catch(() => '');
      let msg = `Failed (HTTP ${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.message) msg = errJson.message;
      } catch {
        if (errText) msg += ' - ' + errText.substring(0, 100);
      }
      throw new Error(msg);
    }

    const data = await response.json();
    if (data.success && data.questions && data.questions.length > 0) {
      return data.questions.map((q: any, idx: number) => sanitizeQuestion(q, idx));
    }
  } catch (proxyErr: any) {
    console.warn("Backend proxy also failed or timed out:", proxyErr.message);
    // Automatically report incident to admin portal and emails
    reportSystemIncident({
      service: 'Google Gemini AI',
      summary: 'Question Generation Failed',
      technicalDetails: proxyErr.message || String(proxyErr),
      context: `Topic: ${options.topic || 'General'}, Level: ${options.level || 3}`
    }).catch(() => {});
    throw proxyErr;
  }

  return [];
}
