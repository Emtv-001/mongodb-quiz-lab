import { FeedbackEntry } from '../types';

const FEEDBACK_KEY = 'mongo_quiz_feedback';

export function getFeedbackEntries(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFeedbackEntries(entries: FeedbackEntry[]): void {
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error("Failed to save feedback", err);
  }
}

export function submitFeedback(
  type: 'complaint' | 'suggestion',
  message: string,
  senderFingerprint: string,
  senderPseudonym: string
): { success: boolean; message: string } {
  if (!message || message.trim().length < 10) {
    return { success: false, message: 'Message must be at least 10 characters long.' };
  }

  const entries = getFeedbackEntries();
  const newEntry: FeedbackEntry = {
    id: 'fb_' + Date.now(),
    type,
    message: message.trim(),
    senderFingerprint,
    senderPseudonym,
    createdAt: new Date().toISOString()
  };

  entries.unshift(newEntry);
  saveFeedbackEntries(entries);

  return { success: true, message: 'Your feedback has been submitted successfully. Thank you!' };
}
