// Client-side service to call the Firebase Cloud Function
import { ProductAnalysisResult, Candidate } from "../types";

// It's good practice to use a relative path if Firebase Hosting rewrites are set up,
// or the full function URL if they are not or if developing locally against deployed functions.
// const FIREBASE_FUNCTION_ANALYZE_IMAGE_URL = '/analyzeImage'; // For use with Firebase Hosting rewrites
// For direct invocation during development or if no rewrites:
// const FIREBASE_FUNCTION_ANALYZE_IMAGE_URL = 'YOUR_FIREBASE_FUNCTION_URL_HERE'; // e.g., https://<region>-<project-id>.cloudfunctions.net/analyzeImage
// We'll use a relative path assuming rewrites will be configured in firebase.json.
const FIREBASE_FUNCTION_ANALYZE_IMAGE_URL = '/analyzeImage';


export const analyzeImageViaServer = async (
  base64ImageData: string,
  imageMimeType: string // Renamed from mimeType for clarity
): Promise<{ analysis: ProductAnalysisResult | null; candidates?: Candidate[]; error?: string; notice?: string }> => {
  try {
    const response = await fetch(FIREBASE_FUNCTION_ANALYZE_IMAGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64ImageData: base64ImageData,
        imageMimeType: imageMimeType, // Ensure server expects this field name
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If parsing error response fails, use status text
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      // Use error message from server response if available
      const serverErrorMessage = errorData?.error || `Server error: ${response.status}`;
      console.error("Server error response:", errorData);
      return { analysis: null, error: serverErrorMessage };
    }

    const result = await response.json(); // Server should return the same structure we expect
    
    // The server will now handle the direct Gemini communication, 
    // so the structure of 'result' should match what 'analyzeImageWithGeminiClientSide' previously returned.
    // It might directly be { analysis, candidates, error, notice }
    // Or it might just be { analysis, candidates } and client wraps error/notice if fetch failed.
    // For now, assume server returns the full structure.

    return {
        analysis: result.analysis || null,
        candidates: result.candidates || undefined,
        error: result.error || undefined,
        notice: result.notice || undefined
    };

  } catch (error) {
    console.error("Error calling analyzeImageViaServer:", error);
    let errorMessage = "Failed to communicate with the analysis server.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { analysis: null, error: errorMessage };
  }
};
