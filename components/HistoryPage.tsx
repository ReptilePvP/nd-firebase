import React, { useState, useEffect } from 'react';
import Icon, { HistoryIconPath } from './Icon';
import { getUserAnalysisResults, AnalysisResult } from '../services/firebaseService';
import { getCurrentUser } from '../services/firebaseService';

const HistoryPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setError("You must be logged in to view history.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const results = await getUserAnalysisResults(currentUser.uid);
        setHistory(results);
      } catch (err) {
        console.error("Error loading history:", err);
        setError("Failed to load history. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const cardBaseClass = "p-6 bg-slate-800 border border-slate-700 rounded-xl shadow-lg transition-default hover:shadow-slate-600/50 animate-fadeIn";

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center mb-6">
        <Icon path={HistoryIconPath} className="w-8 h-8 mr-3 text-sky-400" />
        <h2 className="text-3xl font-bold text-slate-100">Analysis History</h2>
        <button
          onClick={onBack}
          className="ml-auto px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-all duration-150 ease-in-out"
        >
          Back to Analysis
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-400"></div>
          <p className="text-slate-300 ml-4">Loading history...</p>
        </div>
      ) : error ? (
        <div className="p-5 bg-red-900/30 border border-red-700 text-red-300 rounded-xl shadow-lg animate-fadeIn">
          <p>{error}</p>
        </div>
      ) : history.length === 0 ? (
        <div className="p-5 bg-slate-700/50 border border-slate-600 text-slate-300 rounded-xl shadow-lg animate-fadeIn text-center">
          <p>No saved analysis results found. Save your first result to see it here!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {history.map((result) => (
            <div key={result.id} className={`${cardBaseClass} history-item-card`}>
              <h3 className="text-2xl font-semibold text-slate-100 mb-2">{result.productName}</h3>
              <p className="text-sm text-slate-500 mb-3">Saved on {new Date(result.timestamp).toLocaleDateString()} at {new Date(result.timestamp).toLocaleTimeString()}</p>
              {result.imageUrl && (
                <div className="mb-4">
                  <img src={result.imageUrl} alt={result.productName} className="w-32 h-32 object-cover rounded-lg border border-slate-600" />
                </div>
              )}
              <p className="text-slate-300 whitespace-pre-wrap mb-4">{result.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-400">Average Sale Price:</h4>
                  <p className="text-lg font-semibold text-green-300">{result.averageSalePrice}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-400">Estimated Resell Price:</h4>
                  <p className="text-lg font-semibold text-green-300">{result.resellPrice}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
