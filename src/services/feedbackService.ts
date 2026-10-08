import { FeedbackEntry } from '../types';

export async function getFeedbackEntries(): Promise<FeedbackEntry[]> {
  try {
    const res = await fetch('/api/feedback');
    if (!res.ok) return [];
    const data = await res.json();
    return data.feedback || [];
  } catch (err) {
    console.error("Failed to fetch feedback", err);
    return [];
  }
}

export async function submitFeedback(
  type: 'complaint' | 'suggestion',
  message: string,
  senderFingerprint: string,
  senderPseudonym: string
): Promise<{ success: boolean; message: string }> {
  if (!message || message.trim().length < 10) {
    return { success: false, message: 'Message must be at least 10 characters long.' };
  }

  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        message: message.trim(),
        senderFingerprint,
        senderPseudonym
      })
    });

    if (!res.ok) {
      return { success: false, message: 'Failed to submit feedback.' };
    }

    return { success: true, message: 'Your feedback has been submitted successfully. Thank you!' };
  } catch (err) {
    console.error("Failed to submit feedback", err);
    return { success: false, message: 'An error occurred while submitting feedback.' };
  }
}
