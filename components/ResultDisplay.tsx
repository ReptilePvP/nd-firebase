import React, { useState } from 'react';
import { ProductAnalysisResult, GroundingMetadata, GroundingChunkWeb } from '../types'; 
import Icon, { SparklesIconPath, LightBulbIconPath, PriceTagIconPath, SaveIconPath } from './Icon'; 
import { saveAnalysisResult, AnalysisResult } from '../services/firebaseService';
import { getCurrentUser } from '../services/firebaseService';

interface ResultDisplayProps {
  analysisResult: ProductAnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  groundingMetadata?: GroundingMetadata | null; 
  imageData?: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  analysisResult,
  isLoading,
  error,
  groundingMetadata,
  imageData
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSaveResults = async () => {
    if (!analysisResult) return;
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setSaveMessage("You must be logged in to save results.");
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    try {
      const resultToSave: AnalysisResult = {
        userId: currentUser.uid,
        productName: analysisResult.productName || "Unnamed Product",
        description: analysisResult.description || "No description available.",
        averageSalePrice: analysisResult.averageSalePrice || "Unknown",
        resellPrice: analysisResult.resellPrice || "Unknown",
        timestamp: Date.now()
      };
      // Set a timeout for the entire save operation to allow more time for completion
      const savePromise = saveAnalysisResult(resultToSave, imageData);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Save operation timed out after 20 seconds')), 20000);
      });
      await Promise.race([savePromise, timeoutPromise]);
      setSaveMessage("Results saved successfully!");
    } catch (err) {
      console.error("Error saving results:", err);
      setSaveMessage(`Failed to save results: ${err instanceof Error ? err.message : String(err)}. Please try again.`);
    } finally {
      // Ensure the save message is visible for at least 3 seconds before resetting
      setTimeout(() => {
        setIsSaving(false);
      }, 3000);
    }
  };
  if (isLoading) {
    return null; 
  }

  // This specific error display (when !analysisResult) is now handled in App.tsx's right panel logic.
  // Keeping the structure for partial errors if analysisResult is present.
  // if (error && !analysisResult) { 
  //   return (
  //     <div className="p-5 bg-red-900/30 border border-red-700 text-red-300 rounded-xl shadow-lg animate-fadeIn">
  //       <div className="flex items-center mb-2">
  //           <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" className="w-7 h-7 mr-3 text-red-400" />
  //           <h3 className="font-semibold text-xl text-red-300">Analysis Error</h3>
  //       </div>
  //       <p className="whitespace-pre-wrap text-red-400 pl-10">{error}</p>
  //     </div>
  //   );
  // }
  
  if (!analysisResult && !error) { // If no result and no error, render nothing (initial state for panel)
      return null; 
  }

  let webSources: GroundingChunkWeb[] = [];
  if (groundingMetadata?.groundingChunks) {
    webSources = groundingMetadata.groundingChunks.reduce((acc, chunk) => {
      const web = chunk.web;
      if (web && web.uri) {
        if (!acc.find(src => src.uri === web.uri)) {
          acc.push(web);
        }
      }
      return acc;
    }, [] as GroundingChunkWeb[]);
  }

  const { productName, description, averageSalePrice, resellPrice } = analysisResult || {};

  const cardBaseClass = "p-6 bg-slate-800 border border-slate-700 rounded-xl shadow-lg transition-default hover:shadow-slate-600/50 animate-fadeIn";

  return (
    <div className="space-y-6 p-4 md:p-0"> {/* Removed mt-8, added padding for when inside panel */}
      {error && analysisResult && ( // Display partial errors/warnings if analysisResult is also present
         <div className="p-5 bg-orange-900/30 border border-orange-700 text-orange-300 rounded-xl shadow-lg animate-fadeIn">
          <div className="flex items-center mb-1">
            <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" className="w-6 h-6 mr-2.5 text-orange-400" />
            <h3 className="font-semibold text-lg text-orange-300">Additional Information / Warning</h3>
          </div>
          <p className="whitespace-pre-wrap text-orange-400 pl-[34px]">{error}</p>
        </div>
      )}

          {analysisResult && (
            <>
              {productName && (
                <div className={`${cardBaseClass} product-name-card`}>
                  <div className="flex items-center mb-3">
                    <Icon path={LightBulbIconPath} className="w-8 h-8 mr-3.5 text-sky-400" />
                    <h3 className="text-3xl font-semibold text-slate-100">{productName}</h3>
                  </div>
                  <p className="text-sm text-sky-500 pl-[46px] -mt-2">Best Identified Match</p>
                </div>
              )}

          {description && (
            <div className={`${cardBaseClass} description-card`}>
              <div className="flex items-center mb-3">
                <Icon path={SparklesIconPath} className="w-8 h-8 mr-3.5 text-teal-400" /> 
                <h3 className="text-2xl font-semibold text-slate-100">Item Description</h3>
              </div>
              <p className="text-slate-300 whitespace-pre-wrap text-md leading-relaxed pl-[46px]">{description}</p>
            </div>
          )}

          {(averageSalePrice || resellPrice) && (averageSalePrice !== "Unknown" || resellPrice !== "Unknown") && (
            <div className={`${cardBaseClass} pricing-card`}>
              <div className="flex items-center mb-4">
                 <Icon path={PriceTagIconPath} className="w-8 h-8 mr-3.5 text-green-400" /> 
                <h3 className="text-2xl font-semibold text-slate-100">Pricing Information</h3>
              </div>
              <div className="space-y-4 pl-[46px]">
                {averageSalePrice && averageSalePrice !== "Unknown" && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-400">Average Current Sale Price (New/Like-New):</h4>
                    <p className="text-xl font-semibold text-green-300">{averageSalePrice}</p>
                  </div>
                )}
                {resellPrice && resellPrice !== "Unknown" && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-400">Estimated Resell Price (Used):</h4>
                    <p className="text-xl font-semibold text-green-300">{resellPrice}</p>
                  </div>
                )}
                 {(averageSalePrice === "Unknown" && resellPrice === "Unknown") && (
                    <p className="text-slate-500">Specific pricing information was not available for this item.</p>
                 )}
              </div>
            </div>
          )}
          
          {webSources && webSources.length > 0 && (
            <div className={`${cardBaseClass} links-card`}>
              <div className="flex items-center mb-3">
                 <Icon path={["M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"]} className="w-7 h-7 mr-3.5 text-indigo-400" />
                <h3 className="text-2xl font-semibold text-slate-100">Related Web Links</h3>
              </div>
              <ul className="space-y-2 pl-[46px]">
                {webSources.slice(0, 5).map((source, index) => ( 
                  <li key={index} className="text-sm group">
                    <a 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sky-400 hover:text-sky-300 hover:underline group-hover:translate-x-1 inline-block transition-transform duration-200"
                      title={source.title || source.uri}
                    >
                      {source.title || source.uri}
                       <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs ml-1.5">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
              {webSources.length > 5 && <p className="text-xs text-slate-500 mt-3 pl-[46px]">Showing top 5 links out of {webSources.length} found.</p>}
            </div>
          )}
           {analysisResult && (!webSources || webSources.length === 0) && groundingMetadata !== undefined && (
             <div className={`${cardBaseClass} no-links-card`}>
                <div className="flex items-center mb-2">
                    <Icon path={["M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"]} className="w-7 h-7 mr-3 text-indigo-400" />
                    <h3 className="text-xl font-semibold text-slate-100">Related Web Links</h3>
                </div>
                <p className="text-slate-400 pl-[40px]">No specific web links were found by the AI for this item using its search tool.</p>
             </div>
           )}
           
           {analysisResult && getCurrentUser() && (
             <div className="mt-6 flex flex-col items-center">
               <button
                 onClick={handleSaveResults}
                 disabled={isSaving}
                 className={`flex items-center px-6 py-3 text-lg font-medium rounded-lg transition-all duration-150 ease-in-out transform ${
                   isSaving ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-sky-600 text-white hover:bg-sky-700 active:scale-95 active:bg-sky-800'
                 }`}
               >
                 <Icon path={SaveIconPath} className="w-6 h-6 mr-2" />
                 {isSaving ? 'Saving...' : 'Save Analyze Results'}
               </button>
               {saveMessage && (
                 <p className={`mt-2 text-sm ${saveMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{saveMessage}</p>
               )}
             </div>
           )}
        </>
      )}
    </div>
  );
};

export default ResultDisplay;
