import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { Button } from './components/Button';
import { editImageWithGemini } from './services/geminiService';
import { AppStatus, ImageState } from './types';

const App: React.FC = () => {
  const [inputImage, setInputImage] = useState<ImageState>({ file: null, previewUrl: null });
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleImageSelect = useCallback((file: File) => {
    // Revoke old object URL to avoid memory leaks
    if (inputImage.previewUrl) {
      URL.revokeObjectURL(inputImage.previewUrl);
    }
    
    const url = URL.createObjectURL(file);
    setInputImage({ file, previewUrl: url });
    setResultImage(null);
    setStatus(AppStatus.IDLE);
    setErrorMsg(null);
  }, [inputImage.previewUrl]);

  const handleGenerate = async () => {
    if (!inputImage.file || !prompt.trim()) return;

    setStatus(AppStatus.PROCESSING);
    setErrorMsg(null);
    setResultImage(null);

    try {
      const generatedImageDataUrl = await editImageWithGemini(inputImage.file, prompt);
      setResultImage(generatedImageDataUrl);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      setErrorMsg(err.message || "An unexpected error occurred.");
    }
  };

  const handleReset = () => {
    setPrompt('');
    setResultImage(null);
    setStatus(AppStatus.IDLE);
  };

  // Preset prompts for quick testing
  const presets = [
    { label: "Retro Filter", text: "Add a vintage 80s retro filter to this image, making it look like a polaroid." },
    { label: "Cyberpunk", text: "Transform this into a cyberpunk style with neon lights and high contrast." },
    { label: "Sketch", text: "Convert this image into a detailed pencil sketch." },
    { label: "Concept Art Breakdown", text: "Generate a 'Concept Art Depth Breakdown' based on the subject. Place the subject in the center. Surround them with: 1. Clothing layer breakdown (including inner layers). 2. Expression sheet (3-4 faces). 3. Texture close-ups (skin, fabric). 4. Bag content breakdown (what is in their bag?). Maintain a high-quality 2D concept art style on a parchment background." }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              Gemini Lens
            </h1>
          </div>
          <div className="text-sm text-slate-400 hidden sm:block">
            Powered by Gemini 2.5 Flash Image
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left Column: Input */}
          <section className="space-y-6">
            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
              <h2 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs">1</span>
                Upload Source
              </h2>
              <ImageUploader 
                onImageSelected={handleImageSelect} 
                currentImage={inputImage.previewUrl} 
              />
            </div>

            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
              <h2 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs">2</span>
                Describe Edits
              </h2>
              
              <div className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'Make it look like a Van Gogh painting' or 'Remove the person in the background'"
                  className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none placeholder-slate-500 transition-all"
                />
                
                {/* Presets */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Try a preset:</span>
                  <div className="flex flex-wrap gap-2">
                    {presets.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPrompt(p.text)}
                        className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition-colors"
                        title={p.text}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <Button 
                    onClick={handleGenerate} 
                    isLoading={status === AppStatus.PROCESSING}
                    disabled={!inputImage.file || !prompt.trim()}
                    className="flex-1"
                  >
                    Generate Edit
                  </Button>
                  {resultImage && (
                    <Button variant="secondary" onClick={handleReset}>
                      Clear
                    </Button>
                  )}
                </div>

                {errorMsg && (
                   <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                     <p className="font-semibold">Generation Failed</p>
                     <p>{errorMsg}</p>
                   </div>
                )}
              </div>
            </div>
          </section>

          {/* Right Column: Output */}
          <section className="space-y-6">
            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 shadow-xl h-full min-h-[500px] flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
                 <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs">3</span>
                 Result
              </h2>

              <div className="flex-1 rounded-xl bg-slate-900/50 border-2 border-dashed border-slate-700/50 flex items-center justify-center relative overflow-hidden">
                {status === AppStatus.PROCESSING ? (
                  <div className="flex flex-col items-center justify-center text-slate-400 animate-pulse">
                    <div className="w-16 h-16 mb-4 rounded-full bg-slate-700/50"></div>
                    <p className="text-sm">Gemini is dreaming...</p>
                    <p className="text-xs text-slate-500 mt-2">This may take a few seconds</p>
                  </div>
                ) : resultImage ? (
                  <div className="relative w-full h-full flex items-center justify-center p-2">
                     <img 
                      src={resultImage} 
                      alt="Generated" 
                      className="max-w-full max-h-[700px] object-contain rounded-lg shadow-2xl"
                    />
                    <a 
                      href={resultImage} 
                      download={`gemini-edit-${Date.now()}.png`}
                      className="absolute bottom-6 right-6 bg-white text-slate-900 px-4 py-2 rounded-lg font-semibold shadow-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Download
                    </a>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 p-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>The edited image will appear here.</p>
                  </div>
                )}
              </div>
              
              {/* Optional: Tips */}
              {!resultImage && status !== AppStatus.PROCESSING && (
                 <div className="mt-6 text-sm text-slate-500">
                    <p className="font-medium text-slate-400 mb-2">Pro Tips:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Be specific about lighting and style.</li>
                      <li>Try "Replace X with Y" commands.</li>
                      <li>Gemini 2.5 Flash Image is optimized for instruction-following.</li>
                    </ul>
                 </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;