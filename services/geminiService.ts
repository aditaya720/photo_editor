import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * Advanced image editing using Gemini's image-to-image capabilities.
 */
export async function editImageWithAI(
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: `Analyze this image and apply the following edit: ${prompt}. Return ONLY the edited image data.` }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Gemini Image Edit Error:', error);
    return null;
  }
}

/**
 * Text-to-image generation.
 */
export async function generateImageFromText(prompt: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Generate a high-quality, professional image based on this description: ${prompt}` }]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Gemini Image Generation Error:', error);
    return null;
  }
}
