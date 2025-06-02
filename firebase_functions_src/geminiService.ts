import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import * as logger from "firebase-functions/logger";
// Assuming constants and types might be shared or duplicated for server-side
// For simplicity, using direct values here or you might structure to import
// from a shared location if your build process supports it.

// These would typically come from a constants.ts file in the functions directory
const GEMINI_MODEL = 'gemini-2.5-flash-preview-05-20';
const SYSTEM_PROMPT_PRODUCT_ANALYSIS = `You are an expert product analyst. Analyze the provided image to identify the specific product.
Your goal is to return a single, valid JSON object with the following structure and content:
{
  "productName": "string (Full product name, including brand and model, e.g., 'Sony WH-1000XM4 Wireless Noise-Cancelling Headphones')",
  "description": "string (A detailed description of the item, its key features, and common uses. Be thorough.)",
  "averageSalePrice": "string (Estimated average current market sale price for this product when new or in like-new condition. Provide a range if appropriate, e.g., '$250 - $300 USD'. If unknown, state 'Unknown'.)",
  "resellPrice": "string (Estimated average resell price for this product in good used condition. Provide a range if appropriate, e.g., '$150 - $200 USD'. If unknown, state 'Unknown'.)"
}
Focus on the primary product in the image. If multiple distinct products are clearly identifiable as primary, you may focus on the most prominent one or list them if the JSON structure can be adapted (though the current request is for a single object).
Ensure the output is ONLY the JSON object. Do not include any markdown formatting like \`\`\`json or explanatory text before or after the JSON.
Utilize web search capabilities if available to gather accurate information for pricing and product details.`;


// Simplified types for server-side context, matching client's expected structure.
export interface ProductAnalysisResult {
  productName: string;
  description: string;
  averageSalePrice: string;
  resellPrice: string;
}

export interface GroundingChunkWeb {
  uri?: string;
  title?: string;
}
export interface GroundingChunk {
  web?: GroundingChunkWeb;
}
export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}
export interface Candidate {
  content?: { parts: { text: string }[] };
  groundingMetadata?: GroundingMetadata;
  finishReason?: string;
  promptFeedback?: {
    blockReason?: string;
    blockReasonMessage?: string;
  };
}


export const analyzeImageWithGeminiServerSide = async (
  apiKey: string,
  base64ImageData: string, // This now contains the data: prefix
  imageMimeType: string
): Promise<{ analysis: ProductAnalysisResult | null; candidates?: Candidate[]; error?: string; notice?: string }> => {

  // API Key presence is checked in the main function index.ts
  const ai = new GoogleGenAI({ apiKey });

  try {
    // Strip the "data:image/jpeg;base64," prefix if present, as Gemini expects raw base64
    const rawBase64Data = base64ImageData.startsWith('data:')
      ? base64ImageData.split(',')[1]
      : base64ImageData;

    const imagePart = {
      inlineData: {
        mimeType: imageMimeType,
        data: rawBase64Data, // Use the raw base64 data here
      },
    };
    const textPart = { text: "Analyze the product in this image according to your instructions." };
    const contents: Content[] = [{ role: "user", parts: [imagePart, textPart] }];

    logger.info(`Calling Gemini API with model: ${GEMINI_MODEL}`);
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT_PRODUCT_ANALYSIS,
        tools: [{ googleSearch: {} }],
      },
    });
    
    let jsonStr = response.text;

    if (jsonStr === undefined || jsonStr === null) {
        let errorMessage = "Gemini returned no content.";
        let noticeMsg: string | undefined = undefined;

        if (response.promptFeedback?.blockReason) {
            errorMessage = `Gemini content generation was blocked. Reason: ${response.promptFeedback.blockReason}. ${response.promptFeedback.blockReasonMessage || ''}`;
            logger.warn("Gemini content blocked:", errorMessage);
        } else if (response.candidates && response.candidates.length > 0 && response.candidates[0].finishReason && response.candidates[0].finishReason !== 'STOP') {
            errorMessage = `Gemini content generation failed or was stopped. Reason: ${response.candidates[0].finishReason}.`;
            logger.warn("Gemini content generation stopped:", errorMessage);
        } else {
            noticeMsg = "AI analysis returned no specific content from Gemini.";
            logger.info("Gemini returned no specific content but no explicit error/block.");
        }
        return { analysis: null, candidates: response.candidates as Candidate[] | undefined, error: noticeMsg ? undefined : errorMessage, notice: noticeMsg };
    }
    
    jsonStr = jsonStr.trim();
    if (!jsonStr) {
      logger.warn("Gemini analysis returned empty string content.");
      return { analysis: null, candidates: response.candidates as Candidate[] | undefined, notice: "AI analysis resulted in empty content." };
    }

    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }
    
    try {
        const parsedData = JSON.parse(jsonStr);
        if (parsedData && typeof parsedData.productName === 'string' && typeof parsedData.description === 'string') {
             logger.info("Successfully parsed JSON from Gemini.");
             return { analysis: parsedData as ProductAnalysisResult, candidates: response.candidates as Candidate[] | undefined };
        } else {
            logger.warn("Parsed JSON from Gemini analysis is not in the expected format:", parsedData);
            return { analysis: null, candidates: response.candidates as Candidate[] | undefined, error: `AI's response was not in the expected JSON format.`};
        }
    } catch (e) {
        logger.error("Failed to parse JSON response from Gemini analysis:", e, "Raw response snippet:", jsonStr.substring(0,200));
        return { analysis: null, candidates: response.candidates as Candidate[] | undefined, error: `Could not parse AI's JSON response. The AI might have returned text that is not valid JSON.`};
    }

  } catch (error) {
    logger.error("Error in analyzeImageWithGeminiServerSide (Gemini SDK call failed):", error);
    let errorMessage = "Failed to analyze image with Gemini.";
    if (error instanceof Error) {
      // More detailed error messages might be available in error.cause or specific error types from SDK
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }
    return { analysis: null, error: `Gemini API interaction error: ${errorMessage}` };
  }
};
