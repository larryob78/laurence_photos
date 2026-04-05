import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function callClaude(systemPrompt: string, userMessage: string, maxTokens = 2048): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });
  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}

export async function callClaudeJSON<T>(systemPrompt: string, userMessage: string, maxTokens = 4096): Promise<T> {
  const text = await callClaude(systemPrompt, userMessage, maxTokens);
  // Extract JSON from response, handling markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  return JSON.parse(jsonMatch[1]!.trim()) as T;
}

export { anthropic };
