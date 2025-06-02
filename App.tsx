import React, { useState, useEffect, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import Spinner from './components/Spinner';
import LoginScreen from './components/LoginScreen';
import HistoryPage from './components/HistoryPage';
import { ProductAnalysisResult, GroundingMetadata } from './types'; 
import Icon, { 
  NDResellsLogoIconPath, 
  HistoryIconPath, 
  PriceTagIconPath, 
  AnalyzeItemIconPath, 
  AiRecognitionIconSymbolPath,
  MarketAnalysisIconSymbolPath,
  ResaleInsightsIconSymbolPath
} from './components/Icon';
import { analyzeImageViaServer } from './services/geminiService';
import { onAuthChange, logout, User } from './services/firebaseService';

// API Key storage key no longer needed
// const GEMINI_API_KEY_STORAGE_KEY = 'geminiApiKey';

const App: React.FC = () => {
  const [base64ImageData, setBase64ImageData] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const [analysisResult, setAnalysisResult] = useState<ProductAnalysisResult | null>(null);
  const [groundingMetadata, setGroundingMetadata] = useState<GroundingMetadata | null>(null); 
  
  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false); 
  
  const [loadingMessage, setLoadingMessage] = useState<string>("Upload an image to start analysis.");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showResultsInPanel, setShowResultsInPanel] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
    });
    setNotice("Welcome to NDResells! Upload an image to get started.");
    return () => unsubscribe();
  }, []);

  // handleSaveSettings and toggleSettings are no longer needed

  const handleImageSelected = useCallback((file: File, b64Data: string, mimeType: string) => {
    setUploadedFile(file);
    setBase64ImageData(b64Data);
    setImageMimeType(mimeType);
    setError(null);
    setNotice(null);
    setAnalysisResult(null);
    setGroundingMetadata(null); 
    setShowResultsInPanel(false); 
    setIsProcessingImage(false); 
  }, []);

  const handleClear = useCallback(() => {
    setUploadedFile(null);
    setBase64ImageData(null);
    setImageMimeType(null);
    setAnalysisResult(null);
    setGroundingMetadata(null); 
    setError(null);
    setShowResultsInPanel(false);
    setNotice(null); 
    setIsLoading(false);
    setIsProcessingImage(false);
    setLoadingMessage("Upload an image to start analysis.");
  }, []);

  const handleAnalyze = async () => {
    if (!base64ImageData || !imageMimeType) {
      setError("No image selected to analyze.");
      setShowResultsInPanel(true); 
      return;
    }
    // No API key check needed on client
    
    setIsLoading(true);
    setError(null);
    setNotice(null);
    setAnalysisResult(null);
    setGroundingMetadata(null);
    setShowResultsInPanel(true); 
    setLoadingMessage("Preparing image for analysis...");

    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Short delay for UI update
      setLoadingMessage("Sending image to secure server...");
      // Call the new service function that proxies to Firebase
      const result = await analyzeImageViaServer(base64ImageData, imageMimeType);
      setLoadingMessage("Processing AI response...");
      await new Promise(resolve => setTimeout(resolve, 100));

      if (result.error) setError(result.error);
      if (result.notice) setNotice(result.notice); // Server might send notices

      if (result.analysis) {
        setAnalysisResult(result.analysis);
        setGroundingMetadata(result.candidates?.[0]?.groundingMetadata || null);
        if (!result.error && !result.notice) setNotice("Analysis complete. Results displayed.");
      } else if (!result.error && !result.notice) {
        setError("AI analysis did not return a valid result from the server.");
      }
      
    } catch (err) {
      console.error("Error during analysis via server:", err);
      setError(`Critical Error: Failed to connect or get a response from the analysis server. ${(err as Error).message}.`);
    } finally {
      setIsLoading(false);
      setLoadingMessage("Ready for next analysis.");
    }
  };

  const handleLoginSuccess = () => {
    // Any actions to take after successful login, if needed
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error('Error during logout:', err);
      setError(err instanceof Error ? err.message : 'Failed to logout.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const NavButton: React.FC<{ children: React.ReactNode, icon?: string, onClick?: () => void, isActive?: boolean, disabled?: boolean }> = ({ children, icon, onClick, isActive, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ease-in-out transform
                  ${isActive ? 'bg-sky-600 text-white scale-100 shadow-sm' : disabled ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100 active:scale-95 active:bg-slate-600'}`}
    >
      {icon && <Icon path={icon} className="w-5 h-5 mr-2" />}
      {children}
    </button>
  );

  const FeatureHighlightCard: React.FC<{ iconPath: string, iconBgColor: string, iconColor: string, title: string, description: string, animationDelay?: string }> = 
  ({ iconPath, iconBgColor, iconColor, title, description, animationDelay = '0s' }) => (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 flex items-start space-x-4 animate-fadeIn" style={{animationDelay}}>
      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${iconBgColor}`}>
        <Icon path={iconPath} className={`w-6 h-6 ${iconColor}`} specificStroke={iconColor} fill="none"/>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-100 mb-1">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );

  const renderRightPanelContent = () => {
    if (isLoading && base64ImageData) { 
      return (
        <div className="flex flex-col justify-center items-center h-full p-8">
          <Spinner size="lg" color="text-sky-400" />
          <p className="text-xl text-slate-300 mt-5 animate-pulseOpacity">{loadingMessage}</p>
          <p className="text-sm text-slate-500 mt-1">This may take a few moments...</p>
        </div>
      );
    }

    if (showResultsInPanel) {
        if (analysisResult) {
          return (
            <ResultDisplay
              analysisResult={analysisResult}
              isLoading={false}
              error={error && analysisResult ? error : null} 
              groundingMetadata={groundingMetadata}
              imageData={base64ImageData || ''}
            />
          );
        }
      if (error && !analysisResult) { 
        return (
          <div className="p-5 h-full flex flex-col justify-center items-center">
            <div className={`w-full max-w-md p-4 sm:p-5 rounded-xl shadow-lg animate-fadeIn text-sm bg-red-900/30 border border-red-700 text-red-300`}>
              <div className="flex items-start">
                  <Icon 
                    path={"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"} 
                    className={`w-6 h-6 mr-3 text-red-400 flex-shrink-0 mt-0.5`} 
                  />
                  <div>
                      <h3 className={`font-semibold text-lg text-red-300`}>Error</h3>
                      <p className="whitespace-pre-wrap">{error}</p>
                  </div>
              </div>
            </div>
          </div>
        );
      }
       if (notice && !analysisResult && !error) { 
         return (
            <div className="p-5 h-full flex flex-col justify-center items-center">
              <div className={`w-full max-w-md p-4 sm:p-5 rounded-xl shadow-lg animate-fadeIn text-sm bg-sky-900/30 border border-sky-700 text-sky-300`}>
                  <div className="flex items-start">
                      <Icon 
                        path={"M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"} 
                        className={`w-6 h-6 mr-3 text-sky-400 flex-shrink-0 mt-0.5`} 
                      />
                      <div>
                          <h3 className={`font-semibold text-lg text-sky-300`}>Notice</h3>
                          <p className="whitespace-pre-wrap">{notice}</p>
                      </div>
                  </div>
              </div>
            </div>
         );
       }
    }

    return (
      <div className="w-full h-full border-2 border-dashed border-slate-600 rounded-lg flex flex-col justify-center items-center p-8">
        <Icon path={PriceTagIconPath} className="w-16 h-16 sm:w-20 sm:h-20 text-sky-500 mb-4" />
        <p className="text-slate-400 text-center text-md sm:text-lg font-medium">
          Upload an image and click "Analyze Item" to get resale insights from NDResells.
        </p>
      </div>
    );
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center text-slate-200 selection:bg-sky-500 selection:text-white">
      <header className="w-full bg-slate-800/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Icon path={NDResellsLogoIconPath} className="h-8 w-8 text-sky-400" fill="currentColor" />
              <span className="ml-2 text-xl font-bold text-slate-100">NDResells</span>
            </div>
            <nav className="flex space-x-2 sm:space-x-4">
              <NavButton icon={AnalyzeItemIconPath} isActive={!showHistory} onClick={() => {
                setShowHistory(false);
                if (showHistory) {
                  handleClear();
                }
              }}>Analyze Item</NavButton>
              <NavButton icon={HistoryIconPath} isActive={showHistory} onClick={() => setShowHistory(true)}>History</NavButton>
              {currentUser ? (
                <NavButton onClick={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? 'Logging Out...' : 'Logout'}
                </NavButton>
              ) : (
                <NavButton onClick={() => { /* No action needed as LoginScreen is shown by default */ }}>
                  Login
                </NavButton>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">
        {showHistory ? (
          <HistoryPage onBack={() => setShowHistory(false)} />
        ) : (
          <>
            <section className="text-center mb-12 sm:mb-16">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100">
                Scan. Identify. <span className="text-sky-400">Resell.</span>
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto">
                NDResells uses AI to help you identify items from images, discover comparable listings, and estimate their resale potential.
              </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-start">
              <ImageUploader 
                onImageSelected={handleImageSelected} 
                onClear={handleClear}
                onAnalyze={handleAnalyze}
                isLoading={isProcessingImage} 
                isAnalyzing={isLoading && !!base64ImageData} 
                imageAvailable={!!base64ImageData}
              />
              
              <div className="p-1 bg-slate-800 shadow-xl rounded-xl border border-slate-700 flex flex-col justify-center items-center min-h-[400px] md:min-h-full animate-fadeIn md:mt-0 mt-8 overflow-auto" style={{animationDelay: '0.1s'}}>
                {renderRightPanelContent()}
              </div>
            </section>

            <section className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                <FeatureHighlightCard
                    iconPath={AiRecognitionIconSymbolPath}
                    iconBgColor="bg-green-500/20"
                    iconColor="text-green-400"
                    title="AI-Powered Recognition"
                    description="Advanced AI identifies items from photos with high accuracy."
                    animationDelay="0.2s"
                />
                <FeatureHighlightCard
                    iconPath={MarketAnalysisIconSymbolPath}
                    iconBgColor="bg-sky-500/20"
                    iconColor="text-sky-400"
                    title="Market Analysis"
                    description="Get comparable listings and current market prices."
                    animationDelay="0.3s"
                />
                <FeatureHighlightCard
                    iconPath={ResaleInsightsIconSymbolPath}
                    iconBgColor="bg-purple-500/20"
                    iconColor="text-purple-400"
                    title="Resale Insights"
                    description="Estimate potential profit and selling strategies."
                    animationDelay="0.4s"
                />
            </section>
            
            {notice && !base64ImageData && !error && !isLoading && ( 
                 <div className={`mt-10 p-4 sm:p-5 rounded-xl shadow-lg animate-fadeIn text-sm bg-sky-900/30 border border-sky-700 text-sky-300`}>
                    <div className="flex items-center">
                        <Icon 
                          path={"M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"} 
                          className={`w-6 h-6 mr-3 text-sky-400`} 
                        />
                        <div>
                            <h3 className={`font-semibold text-lg text-sky-300`}>Notice</h3>
                            <p className="whitespace-pre-wrap">{notice}</p>
                        </div>
                    </div>
                </div>
            )}
          </>
        )}
      </main>

      {/* SettingsPage component is removed */}

      <footer className="w-full mt-12 sm:mt-16 py-8 border-t border-slate-700 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} NDResells. All rights reserved.</p>
            <p className="text-xs mt-1">
            AI analysis powered by a secure backend. Your images are processed for analysis purposes.
            </p>
            <p className="text-xs mt-1">
                Not affiliated with Google. For demonstration and personal use.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
