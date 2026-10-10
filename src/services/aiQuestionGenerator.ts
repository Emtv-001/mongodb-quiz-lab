import { MongoTopic, Question, DifficultyLevel, CurriculumLevel, QuestionType } from '../types';

export interface GenerationOptions {
  topic?: MongoTopic;
  level?: CurriculumLevel;
  difficulty?: DifficultyLevel;
  type?: QuestionType;
  datasetName?: string;
  count?: number;
}

/**
 * Generates dynamic, AI-synthesized practical MongoDB questions on the fly using Gemini via Vercel backend.
 */
export async function generateAiDynamicQuestions(options: GenerationOptions = {}): Promise<Question[]> {
  try {
    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

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
    if (data.success && data.questions) {
      return data.questions;
    }
    
    return [];
  } catch (error) {
    console.error('AI Generation Error:', error);
    // alert removed for seamless fallback
    throw error;
  }
}
