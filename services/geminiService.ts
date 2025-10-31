import { GoogleGenAI, Modality } from "@google/genai";

async function generateSpeech(text: string): Promise<string | null> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
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
        return base64Audio || null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
}

export async function getQuestionSpeech(questionText: string): Promise<string | null> {
  return generateSpeech(`Say: ${questionText}`);
}

export async function getComplimentSpeech(compliment: string): Promise<string | null> {
    return generateSpeech(compliment);
}
