import React, { useState, useRef, useCallback, ChangeEvent } from 'react';
import Icon, { CameraIconPath, UploadIconPath, TrashIconPath, AnalyzeItemIconPath } from './Icon';
import Spinner from './Spinner';

interface ImageUploaderProps {
  onImageSelected: (file: File, base64Data: string, mimeType: string) => void;
  onClear: () => void;
  onAnalyze: () => void; // New prop to trigger analysis
  isLoading: boolean; // Overall loading state from App
  isAnalyzing: boolean; // Specific state for when "Analyze Item" is clicked
  imageAvailable: boolean; // To enable/disable Analyze button
}

const ImagePlaceholderIconPath = "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z";


const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, onClear, onAnalyze, isLoading, isAnalyzing, imageAvailable }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buttonBase = "flex items-center justify-center px-4 py-2.5 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out transform active:scale-[0.98] shadow hover:shadow-md active:shadow-sm";
  const outlineButtonClasses = `${buttonBase} border-2 border-sky-500 text-sky-400 hover:bg-sky-500 hover:text-white active:bg-sky-600 focus:ring-sky-500 focus:ring-offset-slate-800`;
  const solidButtonClasses = `${buttonBase} bg-sky-600 text-white hover:bg-sky-500 active:bg-sky-700 focus:ring-sky-500 focus:ring-offset-slate-800`;
  const disabledOutlineButtonClasses = "border-2 border-slate-600 text-slate-500 cursor-not-allowed rounded-lg px-4 py-2.5 font-semibold shadow-none";
  const disabledSolidButtonClasses = "bg-slate-600 text-slate-400 cursor-not-allowed rounded-lg px-4 py-2.5 font-semibold shadow-none";


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && canvasRef.current) {
      setProcessingError(null); 
      const canvas = canvasRef.current;
      const reader = new FileReader();

      reader.onloadend = () => {
        if (typeof reader.result !== 'string') {
            setProcessingError("Failed to read file content.");
            return;
        }
        const tempImage = new Image();
        tempImage.onload = () => {
          try {
            let { naturalWidth: width, naturalHeight: height } = tempImage;
            const MAX_DIMENSION = 1024; 

            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
              if (width > height) {
                height = Math.round((height * MAX_DIMENSION) / width);
                width = MAX_DIMENSION;
              } else {
                width = Math.round((width * MAX_DIMENSION) / height);
                height = MAX_DIMENSION;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              setProcessingError("Failed to get canvas context.");
              return;
            }
            
            ctx.drawImage(tempImage, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9); 
            setPreviewUrl(dataUrl);
            const base64Data = dataUrl.split(',')[1];
            
            canvas.toBlob(blob => {
              if (blob) {
                const convertedFile = new File([blob], file.name.substring(0, file.name.lastIndexOf('.')) + ".jpg" || "converted.jpg", { type: 'image/jpeg' });
                setSelectedFile(convertedFile);
                onImageSelected(convertedFile, base64Data, 'image/jpeg');
              } else {
                setProcessingError("Failed to convert image to blob.");
                onImageSelected(file, base64Data, 'image/jpeg'); // Fallback
              }
            }, 'image/jpeg', 0.9);

          } catch (canvasError) {
            console.error("Canvas processing error:", canvasError);
            setProcessingError("Error processing image. Try a standard JPEG or PNG.");
            handleClearInternal();
          }
        };
        tempImage.onerror = () => {
          setProcessingError("Failed to load image. Unsupported format (e.g. HEIC)? Try JPEG or PNG.");
          handleClearInternal();
        };
        tempImage.src = reader.result as string;
      };
      reader.onerror = () => {
        setProcessingError("Error reading file.");
        handleClearInternal();
      };
      reader.readAsDataURL(file);
      stopCamera(); 
    }
  };

  const startCamera = async () => {
    try {
      setProcessingError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
        setPreviewUrl(null); 
        setSelectedFile(null);
        onClear(); 
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      let message = "Could not access camera.";
      if (err instanceof Error && err.name === 'NotAllowedError') {
        message = "Camera access denied. Please grant permission.";
      } else if (err instanceof Error && err.name === 'NotFoundError') {
        message = "No camera found.";
      }
      setProcessingError(message);
      setIsCameraOpen(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      setProcessingError(null);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) {
          setProcessingError("Failed to get canvas context for capture.");
          return;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9); 
        setPreviewUrl(dataUrl);
        
        canvas.toBlob(blob => {
          if (blob) {
            const capturedFile = new File([blob], "capture.jpg", { type: "image/jpeg" });
            setSelectedFile(capturedFile);
            const base64Data = dataUrl.split(',')[1];
            onImageSelected(capturedFile, base64Data, "image/jpeg");
          } else {
             setProcessingError("Failed to create blob from capture.");
          }
        }, 'image/jpeg', 0.9);

      } catch(captureErr) {
        console.error("Error capturing image:", captureErr);
        setProcessingError("Could not capture image.");
      } finally {
        stopCamera();
      }
    }
  };
  
  const handleClearInternal = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
    stopCamera();
  }

  const handleClearClick = () => {
    handleClearInternal();
    setProcessingError(null); 
    onClear();
  };

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="p-6 bg-slate-800 shadow-xl rounded-xl w-full max-w-lg mx-auto border border-slate-700">
      <h2 className="text-2xl font-bold text-slate-100 mb-1">Analyze Item for Resale</h2>
      <p className="text-slate-400 mb-6 text-sm">Upload an image. NDResells will identify the item and provide resale insights.</p>
      
      <div className="mb-5">
        <div className="aspect-video bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden border border-slate-600">
          {previewUrl && !isCameraOpen && (
            <img src={previewUrl} alt="Preview" className="object-contain h-full w-full animate-fadeIn" />
          )}
          {isCameraOpen && (
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover"></video>
          )}
          {!previewUrl && !isCameraOpen && (
            <div className="text-slate-500 text-center p-4">
               <Icon path={ImagePlaceholderIconPath} className="w-16 h-16 mx-auto mb-2 text-slate-500" />
              <p className="text-md">Image preview will appear here</p>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      </div>

      {processingError && <p className="text-red-400 text-sm mb-4 p-3 bg-red-900/30 border border-red-700 rounded-md">{processingError}</p>}

      <div className="space-y-4">
        {!isCameraOpen && (
          <>
            <p className="text-sm font-medium text-slate-300 mb-2">Upload Image or Use Camera</p>
            <div className="grid grid-cols-2 gap-3">
              <label htmlFor="imageUpload" className={`${isLoading || isAnalyzing ? disabledOutlineButtonClasses : outlineButtonClasses} w-full cursor-pointer`}>
                <Icon path={UploadIconPath} className="w-5 h-5 mr-2" />
                <span>Upload</span>
              </label>
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
                disabled={isLoading || isAnalyzing}
              />
              <button
                onClick={startCamera}
                disabled={isLoading || isAnalyzing}
                className={`${isLoading || isAnalyzing ? disabledOutlineButtonClasses : outlineButtonClasses} w-full`}
              >
                <Icon path={CameraIconPath} className="w-5 h-5 mr-2" />
                <span>Camera</span>
              </button>
            </div>
          </>
        )}

        {isCameraOpen && (
           <div className="grid grid-cols-2 gap-3">
            <button
                onClick={captureImage}
                disabled={isLoading || isAnalyzing}
                className={`${isLoading || isAnalyzing ? disabledSolidButtonClasses : solidButtonClasses} bg-green-600 hover:bg-green-500 active:bg-green-700 focus:ring-green-500 focus:ring-offset-slate-800 w-full`}
            >
                <Icon path={CameraIconPath} className="w-5 h-5 mr-2" />
                <span>Capture</span>
            </button>
             <button
                onClick={handleClearClick}
                disabled={isLoading || isAnalyzing}
                className={`${isLoading || isAnalyzing ? disabledOutlineButtonClasses : outlineButtonClasses} border-slate-500 text-slate-400 hover:bg-slate-700 active:bg-slate-600 focus:ring-slate-500 focus:ring-offset-slate-800 w-full`}
            >
                <Icon path={TrashIconPath} className="w-5 h-5 mr-2" />
                <span>Cancel</span>
            </button>
          </div>
        )}

        {(previewUrl || selectedFile) && !isCameraOpen && (
          <button
            onClick={handleClearClick}
            disabled={isLoading || isAnalyzing}
            className={`${isLoading || isAnalyzing ? disabledOutlineButtonClasses : outlineButtonClasses} border-red-500 text-red-400 hover:bg-red-500 hover:text-white active:bg-red-600 focus:ring-red-500 focus:ring-offset-slate-800 w-full mt-3`}
          >
            <Icon path={TrashIconPath} className="w-5 h-5 mr-2" />
            <span>Clear Image</span>
          </button>
        )}

        <button
          onClick={onAnalyze}
          disabled={!imageAvailable || isLoading || isAnalyzing}
          className={`${!imageAvailable || isLoading || isAnalyzing ? disabledSolidButtonClasses : solidButtonClasses} w-full py-3 mt-2 text-base`}
        >
          {isAnalyzing ? (
            <Spinner size="sm" color="text-white" />
          ) : (
            <Icon path={AnalyzeItemIconPath} className="w-5 h-5 mr-2" />
          )}
          <span>{isAnalyzing ? "Analyzing..." : "Analyze Item"}</span>
        </button>
      </div>
    </div>
  );
};

export default ImageUploader;