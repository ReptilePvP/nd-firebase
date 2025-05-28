
export interface ProductAnalysisResult {
  productName: string;
  description: string;
  averageSalePrice: string; // e.g., "$100 - $120 USD"
  resellPrice: string;      // e.g., "$70 - $90 USD"
  // Links will be handled via groundingMetadata for Gemini
}

// This interface might be used if we decide to represent the final display structure
export interface IdentifiedObject {
  productName: string;
  description: string;
  averageSalePrice?: string;
  resellPrice?: string;
  // Potentially add a field for an error message specific to this item if parsing fails partially
}


export interface ValuationResult { // This might become obsolete or merged
  name: string;
  description: string;
  estimatedValue: string;
}

export type ValuationApiResponse = ValuationResult[];

// Gemini-specific types
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
  // Add finishReason for better error diagnostics
  finishReason?: string;
  // Add promptFeedback for block reasons
  promptFeedback?: {
    blockReason?: string;
    blockReasonMessage?: string;
  };
}
