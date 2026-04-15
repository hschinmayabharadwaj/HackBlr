'use server';

import {
    voiceAgent as voiceAgentFlow,
    textToSpeech as textToSpeechFlow,
    speechToText as speechToTextFlow,
    type ConversationInput,
    type TTSInput,
    type STTInput,
} from '@/ai/flows/voice-agent-flow';
import { buildMemoryContext, recordConversationMemory } from '@/lib/semantic-memory';

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientGenAIOverload(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.toLowerCase();
    return normalized.includes('503')
        || normalized.includes('service unavailable')
        || normalized.includes('high demand');
}

async function runVoiceAgentWithRetry(input: ConversationInput, maxRetries = 2) {
    let attempt = 0;

    while (true) {
        try {
            return await voiceAgentFlow(input);
        } catch (error) {
            if (!isTransientGenAIOverload(error) || attempt >= maxRetries) {
                throw error;
            }

            const backoffMs = 400 * Math.pow(2, attempt);
            attempt += 1;
            await sleep(backoffMs);
        }
    }
}


export async function voiceAgent(input: ConversationInput) {
    try {
        const memoryKey = input.memoryKey?.trim() || 'anonymous';
        const memoryContext = await buildMemoryContext(memoryKey, input.currentInput);
        const response = await runVoiceAgentWithRetry({
            ...input,
            memoryKey,
            memoryContext,
        });

        await recordConversationMemory(memoryKey, input.currentInput, response.response);

        return response;
    } catch (error) {
        console.error("Error in voice agent flow:", error);
        return { response: "I'm having a little trouble understanding. Could you please say that again?" };
    }
}

export async function textToSpeech(input: TTSInput) {
    try {
        const response = await textToSpeechFlow(input);
        return response;
    } catch (error) {
        console.error("Error in text-to-speech flow:", error);
        return { audioDataUri: "" };
    }
}

export async function speechToText(input: STTInput) {
    try {
        const response = await speechToTextFlow(input);
        return response;
    } catch (error) {
        console.error("Error in speech-to-text flow:", error);
        return { transcript: "" };
    }
}


