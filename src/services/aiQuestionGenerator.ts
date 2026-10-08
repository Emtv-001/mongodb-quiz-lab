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
      throw new Error('Failed to generate AI questions.');
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
