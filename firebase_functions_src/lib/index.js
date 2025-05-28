"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeImage = void 0;
const logger = __importStar(require("firebase-functions/logger"));
const https_1 = require("firebase-functions/v2/https");
const cors_1 = __importDefault(require("cors"));
const geminiService_1 = require("./geminiService"); // Server-side Gemini logic
const corsHandler = (0, cors_1.default)({ origin: true });
// Ensure API_KEY is set in Firebase Function environment variables
// (e.g., firebase functions:config:set api_key="YOUR_KEY" or via .env files for Gen 2)
const API_KEY = "AIzaSyDi_wEL3LoVTIRadXCxkRra84QSj6fc3PQ";
logger.info("Using hardcoded API key for testing purposes.");
exports.analyzeImage = (0, https_1.onRequest)({
    region: "us-central1", // Example region, choose one close to your users
    timeoutSeconds: 60, // Increased timeout for potentially long AI calls
    memory: "512MiB", // Adjust memory as needed
}, async (request, response) => {
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
            const result = await (0, geminiService_1.analyzeImageWithGeminiServerSide)(API_KEY, base64ImageData, imageMimeType);
            // Log the raw result from the Gemini service for debugging if needed
            // logger.debug("Result from Gemini service:", JSON.stringify(result));
            if (result.error) {
                logger.error("Error from Gemini service:", result.error);
                // Send a 4xx or 5xx status code depending on the error type if possible
                // For simplicity, sending 500 for any service error now, can be refined.
                // If it's a known client error (e.g. bad image), could be 400.
                // If it's an AI block, could be 400 or specific.
                response.status(result.error.startsWith("Gemini content generation was blocked") ? 400 : 500).json(result);
            }
            else {
                logger.info("Successfully processed image, sending analysis.");
                response.status(200).json(result);
            }
        }
        catch (error) {
            logger.error("Unhandled exception in analyzeImage function:", error);
            let message = "Internal Server Error during image analysis.";
            if (error instanceof Error) {
                message = error.message;
            }
            response.status(500).json({ error: message });
        }
    });
});
//# sourceMappingURL=index.js.map