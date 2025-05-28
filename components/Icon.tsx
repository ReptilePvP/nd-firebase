import React from 'react';

interface IconProps {
  path: string | string[]; // SVG path data or array of paths for multi-path icons
  className?: string;
  viewBox?: string;
  fill?: string; // Added fill prop
  strokeWidth?: string; // Added strokeWidth prop
  specificFill?: string; // For icons that need a specific fill color (e.g. feature icons)
  specificStroke?: string; // For icons that need a specific stroke color
}

const Icon: React.FC<IconProps> = ({ path, className = 'w-6 h-6', viewBox = '0 0 24 24', fill = 'none', strokeWidth = "1.5", specificFill, specificStroke }) => {
  const paths = Array.isArray(path) ? path : [path];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill={specificFill || fill}
      viewBox={viewBox}
      strokeWidth={strokeWidth}
      stroke={specificStroke || "currentColor"}
      className={className}
    >
      {paths.map((p, index) => (
        <path key={index} strokeLinecap="round" strokeLinejoin="round" d={p} />
      ))}
    </svg>
  );
};

export const CameraIconPath = "M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z";
export const UploadIconPath = "M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5";
export const TrashIconPath = "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0";
export const SparklesIconPath = "M9.53 2.47a.75.75 0 0 1 0 1.06L8.31 4.75l-.26.26a.75.75 0 0 0 1.06 1.06l.26-.26 1.185-1.185a.75.75 0 0 1 1.062 0l1.22 1.22a.75.75 0 0 0 1.06 0l.26-.26 1.19-1.19a.75.75 0 1 1 1.06 1.06l-1.19 1.19-.26.26a.75.75 0 0 0 0 1.06l1.22 1.22a.75.75 0 1 1-1.06 1.06l-1.22-1.22a.75.75 0 0 0-1.06 0l-.26.26-1.19 1.19a.75.75 0 1 1-1.06-1.06l1.19-1.19.26-.26a.75.75 0 0 0 0-1.06L9.53 3.53a.75.75 0 0 1 0-1.06ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z";
export const LightBulbIconPath = "M12 18.75a.75.75 0 0 0 .75.75h.01a.75.75 0 0 0 .75-.75V18a3 3 0 0 0 3-3V9.75a6.75 6.75 0 0 0-13.5 0V15a3 3 0 0 0 3 3v.75Zm-4.5-3.75A1.5 1.5 0 0 1 9 13.5V9.75a5.25 5.25 0 0 1 10.5 0V13.5a1.5 1.5 0 0 1-1.5 1.5H7.5Z";
export const SettingsIconPath = "M10.343 3.94c.09-.542.56-1.004 1.11-1.134a9.001 9.001 0 0 1 2.092 0c.55.130 1.02.592 1.11 1.134.048.293.069.593.069.896s-.021.603-.069.896c-.09.542-.56 1.004-1.11 1.134a9.001 9.001 0 0 1-2.092 0c-.55-.130-1.02-.592-1.11-1.134A6.01 6.01 0 0 1 10.343 4.836a6.01 6.01 0 0 1 0-.896zm1.75-2.122a11.01 11.01 0 0 0-3.5 0c-1.15.26-2.048 1.29-2.048 2.702v.198c0 .427.027.85.081 1.268l-4.753 4.753a1.5 1.5 0 0 0 0 2.121l4.753 4.753c-.054.418-.081.841-.081 1.268v.198c0 1.413.897 2.442 2.048 2.703a11.01 11.01 0 0 0 3.5 0c1.15-.26 2.048-1.29 2.048-2.703v-.198c0-.427-.027.85-.081-1.268l4.753-4.753a1.5 1.5 0 0 0 0-2.121l-4.753-4.753c.054-.418.081.841.081-1.268v.198c0-1.413-.897-2.442-2.048-2.703zM12 14.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5z";

// NDResells UI Icons
export const NDResellsLogoIconPath = "M16.243 3.057A1.5 1.5 0 0015 2.25H9A1.5 1.5 0 007.757 3.057L3.057 7.757A1.5 1.5 0 002.25 9v6a1.5 1.5 0 00.807 1.343l4.7 4.7A1.5 1.5 0 009 21.75h6a1.5 1.5 0 001.343-.807l4.7-4.7A1.5 1.5 0 0021.75 15V9a1.5 1.5 0 00-.807-1.343L16.243 3.057zM15.5 10.75a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z";
export const HistoryIconPath = "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z";
export const PriceTagIconPath = "M12.586 2.586A2 2 0 0011.172 2H4a2 2 0 00-2 2v7.172a2 2 0 00.586 1.414l7 7a2 2 0 002.828 0l7-7a2 2 0 000-2.828l-7-7zM6.5 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3z";
export const AnalyzeItemIconPath = SparklesIconPath;

// Feature Highlight Icons (Paths for the symbol inside the colored circle)
// AI Recognition Icon (e.g., a brain or chip)
export const AiRecognitionIconSymbolPath = "M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a8.97 8.97 0 00-1.06-.744.75.75 0 01.162-1.378A10.47 10.47 0 019 4.5c1.406 0 2.744.325 3.938.896a.75.75 0 01.162 1.378A8.97 8.97 0 009 6c-.68 0-1.336.076-1.972.218a.75.75 0 01-.162-.819A10.47 10.47 0 019 1.5c1.406 0 2.744.325 3.938.896ZM12 12.75a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM14.25 9.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM9.75 9.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12 6.75a1.5 1.5 0 100-3 1.5 1.5 0 000 3z";
// Market Analysis uses PriceTagIconPath (blue)
export const MarketAnalysisIconSymbolPath = PriceTagIconPath;
// Resale Insights Icon (e.g., a trending chart or cycle arrows)
export const ResaleInsightsIconSymbolPath = "M15 12a3 3 0 11-6 0 3 3 0 016 0z M21.188 10.138A9.001 9.001 0 0112 21a9.001 9.001 0 01-9.188-10.862 9 9 0 0118.376 0zM12 1.5A10.5 10.5 0 001.5 12c0 .85.103 1.674.295 2.461A.75.75 0 011.5 15a.75.75 0 01.75-.75A9.004 9.004 0 013 12a9 9 0 1115.188-6.862.75.75 0 111.312-.776A10.47 10.47 0 0012 1.5z";


export default Icon;