import { GoogleGenAI, Modality } from "@google/genai";
import { Language } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function detectSignFromImage(base64Image: string): Promise<string> {
    try {
        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
            },
        };
        const textPart = {
            text: "Identify the American Sign Language (ASL) alphabet letter (A-Z) shown in this image. Respond with only the single capital letter that corresponds to the sign. For example, if you see the sign for 'C', respond with 'C'. If no ASL alphabet sign is visible, or if the gesture represents a number or a word, respond with 'No sign detected'.",
        };
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });
        const result = response.text.trim();
        
        // Validate the result: it should be a single letter, not the "no sign detected" message.
        if (result.toLowerCase().includes('no sign detected') || !/^[A-Z]$/i.test(result)) {
            return ''; // Return empty string if no sign is detected or it's not a single letter
        }

        return result.toUpperCase();
    } catch (error) {
        console.error('Error detecting sign:', error);
        throw new Error('Failed to detect sign from image.');
    }
}


export async function translateText(text: string, targetLanguage: Language): Promise<string> {
    try {
        const prompt = `Translate the following English letter into ${targetLanguage}: "${text}". Only return the translated text, with no additional explanation or formatting.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error(`Error translating to ${targetLanguage}:`, error);
        throw new Error(`Failed to translate text to ${targetLanguage}.`);
    }
}

export async function generateSpeech(text: string): Promise<string> {
    if (!text) {
        throw new Error("Text to speak cannot be empty.");
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }

        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate speech.");
    }
}