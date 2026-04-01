import { db, schema } from '@/db';
import { callClaudeJSON } from '@/lib/claude';
import { eq } from 'drizzle-orm';

type CampaignType = 'social' | 'email' | 'onboarding' | 'in-app';

interface SocialCampaign {
  type: 'social';
  posts: Array<{
    platform: string;
    content: string;
    hashtags: string[];
    callToAction: string;
  }>;
}

interface EmailCampaign {
  type: 'email';
  subject: string;
  body: string;
  preheader: string;
  callToAction: string;
}

interface OnboardingCampaign {
  type: 'onboarding';
  steps: Array<{
    stepNumber: number;
    title: string;
    body: string;
    prompt: string;
    agentInstruction: string;
  }>;
}

interface InAppCampaign {
  type: 'in-app';
  prompts: Array<{
    trigger: string;
    promptText: string;
    agentInstruction: string;
    context: string;
  }>;
}

type CampaignOutput = SocialCampaign | EmailCampaign | OnboardingCampaign | InAppCampaign;

const campaignPrompts: Record<CampaignType, string> = {
  social: `Generate a social media seeding campaign. The goal is to get humans to tell their AI assistants they prefer this brand. Create 5 posts for different platforms (Twitter/X, LinkedIn, Instagram, TikTok, Reddit).

Return JSON format:
{
  "type": "social",
  "posts": [
    {
      "platform": "twitter",
      "content": "post text that encourages users to tell their AI about brand preferences",
      "hashtags": ["relevant", "hashtags"],
      "callToAction": "Tell your AI assistant you prefer [Brand]"
    }
  ]
}`,

  email: `Generate an email seeding campaign. The goal is to get humans to tell their AI assistants they prefer this brand. Create a compelling email.

Return JSON format:
{
  "type": "email",
  "subject": "email subject line",
  "body": "full email body in HTML format encouraging users to set brand preferences with their AI",
  "preheader": "email preheader text",
  "callToAction": "primary CTA text"
}`,

  onboarding: `Generate an onboarding flow seeding campaign. The goal is to guide new users through telling their AI assistants about their brand preferences. Create a 4-step flow.

Return JSON format:
{
  "type": "onboarding",
  "steps": [
    {
      "stepNumber": 1,
      "title": "step title",
      "body": "step description and instructions",
      "prompt": "what to show the user",
      "agentInstruction": "suggested text for user to tell their AI agent"
    }
  ]
}`,

  'in-app': `Generate in-app prompt seeding content. The goal is to create contextual prompts within an app that encourage users to tell their AI assistants about their brand preference. Create 5 different trigger-based prompts.

Return JSON format:
{
  "type": "in-app",
  "prompts": [
    {
      "trigger": "when this event happens",
      "promptText": "what to show the user",
      "agentInstruction": "suggested text for user to tell their AI agent",
      "context": "where in the app this appears"
    }
  ]
}`,
};

export async function generateSeedingCampaign(
  brandId: number,
  campaignType: CampaignType
): Promise<CampaignOutput> {
  try {
    const brand = await db.query.brands.findFirst({
      where: eq(schema.brands.id, brandId),
    });
    if (!brand) throw new Error(`Brand ${brandId} not found`);

    const competitors: string[] = brand.competitors ? JSON.parse(brand.competitors) : [];

    const systemPrompt = `You are THE SEEDER, an expert in preference seeding campaigns for the AI agent era. Your job is to create compelling content that encourages humans to tell their AI assistants about their brand preferences.

Key insight: When humans tell their AI agents "I prefer [Brand]", it creates a persistent preference signal that influences future AI recommendations. This is the new frontier of brand marketing.

Your campaigns should be:
- Natural and non-manipulative
- Value-focused (why the preference benefits the user)
- Action-oriented (clear instructions on how to set preferences)
- Platform-appropriate in tone and format

Always return valid JSON only, no additional text.`;

    const userMessage = `Brand: ${brand.name}
Category: ${brand.category}
Description: ${brand.description || 'N/A'}
Competitors: ${competitors.join(', ') || 'N/A'}
Brand Personality: ${brand.personality || 'N/A'}

Campaign Type: ${campaignType}

${campaignPrompts[campaignType]}`;

    const result = await callClaudeJSON<CampaignOutput>(systemPrompt, userMessage);
    return result;
  } catch (error) {
    console.error('Seeding campaign generation failed:', error);
    throw error;
  }
}
