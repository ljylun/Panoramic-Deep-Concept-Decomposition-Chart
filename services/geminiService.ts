import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string suitable for the API.
 */
const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the Data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64String = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64String,
            mimeType: file.type,
          },
        });
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Sends an image and a text prompt to Gemini 2.5 Flash Image to generate/edit content.
 */
export const editImageWithGemini = async (
  imageFile: File,
  prompt: string
): Promise<string> => {
  try {
    const imagePart = await fileToPart(imageFile);
    
    // Using gemini-2.5-flash-image as requested for image editing tasks
    const model = 'gemini-2.5-flash-image';

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          imagePart,
          { text: prompt }
        ]
      }
    });

    // Iterate through parts to find the image part
    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content.parts;
      if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                // Return the generated image as a Data URL
                // Note: The API usually returns image/png or image/jpeg. 
                // We construct a standard Data URL.
                return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
        }
      }
    }

    // Fallback if no image found in response (sometimes it might just return text if it refused)
    const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
    if (textPart) {
        throw new Error(`The model returned text instead of an image: "${textPart.slice(0, 100)}..."`);
    }

    throw new Error("No image data received from Gemini.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate image.");
  }
};