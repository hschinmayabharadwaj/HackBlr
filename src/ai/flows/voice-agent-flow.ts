'use server';

/**
 * @fileOverview A voice-first accessibility agent that helps users understand,
 * act on, and remember information through conversation.
 *
 * - voiceAgent - A function that generates a spoken response.
 * - textToSpeech - A function that converts text to audio.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';

// Define schemas for the conversational flow
const ConversationInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe('The conversation history.'),
  currentInput: z.string().describe("The user's latest voice input, transcribed to text."),
  memoryKey: z.string().optional().describe('Optional memory scope for personalization and retrieval.'),
  memoryContext: z.string().optional().describe('Relevant contextual memories retrieved for this turn.'),
});

const ConversationOutputSchema = z.object({
  response: z.string().describe("The AI's clear, helpful, and conversational response."),
});

// Define schemas for the TTS flow
const TTSInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
});

const TTSOutputSchema = z.object({
  audioDataUri: z.string().describe('The base64 encoded WAV audio data URI.'),
});

export type ConversationInput = z.infer<typeof ConversationInputSchema>;
export type ConversationOutput = z.infer<typeof ConversationOutputSchema>;
export type TTSInput = z.infer<typeof TTSInputSchema>;
export type TTSOutput = z.infer<typeof TTSOutputSchema>;

// Define schemas for speech-to-text
const STTInputSchema = z.object({
  audioDataUri: z.string().describe('Base64 encoded audio data URI from the microphone.'),
});

const STTOutputSchema = z.object({
  transcript: z.string().describe('The transcribed text from the audio.'),
});

export type STTInput = z.infer<typeof STTInputSchema>;
export type STTOutput = z.infer<typeof STTOutputSchema>;

export async function voiceAgent(input: ConversationInput): Promise<ConversationOutput> {
  return voiceAgentFlow(input);
}

export async function textToSpeech(input: TTSInput): Promise<TTSOutput> {
  return textToSpeechFlow(input);
}

export async function speechToText(input: STTInput): Promise<STTOutput> {
  return speechToTextFlow(input);
}


// Optimized helper function to convert PCM audio data from Gemini to WAV format
async function toWav(pcmData: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const writer = new wav.Writer({
                channels: 1,
                sampleRate: 24000,
                bitDepth: 16,
            });

            const buffers: Buffer[] = [];
            
            writer.on('data', (chunk) => buffers.push(chunk));
            writer.on('end', () => {
                try {
                    const finalBuffer = Buffer.concat(buffers);
                    resolve(finalBuffer.toString('base64'));
                } catch (error) {
                    reject(error);
                }
            });
            writer.on('error', reject);

            // Process audio data efficiently
            writer.write(pcmData);
            writer.end();
        } catch (error) {
            reject(error);
        }
    });
}

const voiceAgentPrompt = ai.definePrompt({
    name: 'voiceAgentPrompt',
    input: { schema: ConversationInputSchema },
    output: { schema: ConversationOutputSchema },
    prompt: `You are ManasMitra, a voice-first accessibility and workflow assistant. Your goal is to help people understand information, complete tasks, and move through systems using natural conversation.

  - **Use plain language:** Keep responses short, clear, and easy to act on.
  - **Help people get things done:** Summarize, translate, explain, compare options, or outline the next step when useful.
  - **Use workflow framing when helpful:** For forms, documents, or service navigation, answer with a short summary, the next steps, and any missing information the user may need.
  - **Maintain context:** Remember the user's goal, refer back to earlier details, and avoid making them repeat themselves.
  - **Ask one question at a time:** If something is unclear, ask the smallest helpful follow-up.
  - **Adapt to the user:** Offer simpler wording, a different language, or a step-by-step explanation when needed.
  - **Be concrete:** If the user asks for translation, provide the translated text plus a plain-language note if it helps.
  - **Keep it conversational:** Responses should feel natural in voice, ideally 1-3 short sentences.
  - **Protect safety:** If the user may be at immediate risk or asks for dangerous guidance, prioritize safety and encourage urgent human help.

{{#if memoryContext}}
Relevant memory:
{{memoryContext}}
{{/if}}

Conversation History:
{{#each history}}
- {{role}}: {{content}}
{{/each}}

User's current input: "{{currentInput}}"

Your response:`
});

const voiceAgentFlow = ai.defineFlow(
    {
      name: 'voiceAgentFlow',
      inputSchema: ConversationInputSchema,
      outputSchema: ConversationOutputSchema,
    },
    async (input) => {
        const { output } = await voiceAgentPrompt(input);
        return output!;
    }
);

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TTSInputSchema,
    outputSchema: TTSOutputSchema,
  },
  async ({ text }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
        // Optimize for faster generation
        maxOutputTokens: 1000, // Limit response length for faster processing
        temperature: 0.7, // Slightly reduce creativity for more consistent responses
      },
      prompt: text,
    });
    if (!media) {
      throw new Error('No audio was generated from the TTS model.');
    }
    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWav(audioBuffer);
    
    return {
        audioDataUri: `data:audio/wav;base64,${wavBase64}`
    };
  }
);

const speechToTextFlow = ai.defineFlow(
  {
    name: 'speechToTextFlow',
    inputSchema: STTInputSchema,
    outputSchema: STTOutputSchema,
  },
  async ({ audioDataUri }) => {
    const { text } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: [
        { media: { url: audioDataUri } },
        { text: 'Transcribe this audio exactly as spoken. Return only the transcription, nothing else.' },
      ],
    });
    return { transcript: text?.trim() || '' };
  }
);
