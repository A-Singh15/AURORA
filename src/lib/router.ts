import axios from 'axios';

// ⚠️ WARNING: Do not expose this key in production frontend apps!
const OPENROUTER_API_KEY = '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';

export async function chatWithOpenRouter(messages: ({ role: string; content: string } | {
  role: string;
  content: string
})[]) {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'google/gemma-3-27b-it:free', // ✅ Using Google's free Gemma 3 27B model
      messages: messages,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        // Optional headers (for leaderboard visibility):
        'HTTP-Referer': 'http://localhost:3000', // 👈 or your deployed URL
        'X-Title': 'Emotion AI Chat App',
      },
    }
  );

  return response.data;
}
