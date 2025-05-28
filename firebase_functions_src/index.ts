
import * as logger from "firebase-functions/logger";
import { onRequest, Request } from "firebase-functions/v2/https";
import cors from "cors";
import { analyzeImageWithGeminiServerSide } from "./geminiService"; // Server-side Gemini logic

const corsHandler = cors({ origin: true });

// Ensure API_KEY is set in Firebase Function environment variables
// (e.g., firebase functions:config:set api_key="YOUR_KEY" or via .env files for Gen 2)
const API_KEY = "AIzaSyDi_wEL3LoVTIRadXCxkRra84QSj6fc3PQ";
logger.info("Using hardcoded API key for testing purposes.");

export const analyzeImage = onRequest(
  {
    region: "us-central1", // Example region, choose one close to your users
    timeoutSeconds: 60,    // Increased timeout for potentially long AI calls
    memory: "512MiB",      // Adjust memory as needed
  },
  async (request: Request, response: any) => {
    corsHandler(request, response, async () => {
      if (request.method !== "POST") {
        response.status(405).send("Method Not Allowed");
        return;
      }

      const { base64ImageData, imageMimeType } = request.body;

      if (!base64ImageData || !imageMimeType) {
        logger.error("Missing base64ImageData or imageMimeType in request body");
        response.status(400).json({
          error: "Missing base64ImageData or imageMimeType in request body.",
        });
        return;
      }

        try {
          logger.info("Received request, calling analyzeImageWithGeminiServerSide with hardcoded API key.");
          const result = await analyzeImageWithGeminiServerSide(
            API_KEY,
            base64ImageData,
            imageMimeType
          );
        
        // Log the raw result from the Gemini service for debugging if needed
        // logger.debug("Result from Gemini service:", JSON.stringify(result));

        if (result.error) {
          logger.error("Error from Gemini service:", result.error);
          // Send a 4xx or 5xx status code depending on the error type if possible
          // For simplicity, sending 500 for any service error now, can be refined.
          // If it's a known client error (e.g. bad image), could be 400.
          // If it's an AI block, could be 400 or specific.
           response.status(result.error.startsWith("Gemini content generation was blocked") ? 400 : 500).json(result);
        } else {
          logger.info("Successfully processed image, sending analysis.");
          response.status(200).json(result);
        }
      } catch (error) {
        logger.error("Unhandled exception in analyzeImage function:", error);
        let message = "Internal Server Error during image analysis.";
        if (error instanceof Error) {
            message = error.message;
        }
        response.status(500).json({ error: message });
      }
    });
  }
);
