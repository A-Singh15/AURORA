import axios from 'axios';

// ⚠️ WARNING: Do not expose this key in production frontend apps!
const GROQ_API_KEY = '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';

export async function chatWithOpenRouter(messages: { role: string; content: string }[]) {
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama3-70b-8192', // ✅ Using Groq’s LLaMA 3 model
      messages: messages,
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        // These optional headers are safe to remove or keep
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Emotion AI Chat App',
      },
    }
  );

  return response.data;
}
