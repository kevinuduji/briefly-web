import OpenAI from 'openai';

let cached;

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!cached) {
    cached = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return cached;
}

export async function chatJson({ system, user }) {
  const client = getOpenAI();
  if (!client) {
    throw new Error('OPENAI_API_KEY is not configured on the server.');
  }
  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.35,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  const content = completion.choices?.[0]?.message?.content;
  if (content == null || content === '') {
    throw new Error('Empty model response');
  }
  return content;
}
