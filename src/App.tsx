/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Upload, 
  Camera, 
  CheckCircle2, 
  Loader2, 
  Download, 
  RefreshCw,
  User,
  Briefcase,
  Building2,
  Sun,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

type Style = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  prompt: string;
};

const STYLES: Style[] = [
  {
    id: 'corporate-grey',
    name: 'Corporate Grey',
    description: 'Classic studio look with a neutral grey backdrop.',
    icon: <User className="w-5 h-5" />,
    prompt: 'Professional corporate headshot with a neutral grey studio background. Professional studio lighting. The person should be wearing a formal business suit or professional blazer. High-end executive look.'
  },
  {
    id: 'tech-office',
    name: 'Modern Tech',
    description: 'Bright, modern office environment with depth.',
    icon: <Building2 className="w-5 h-5" />,
    prompt: 'Professional headshot in a modern tech office setting. Blurred background with glass walls, plants, and soft office lighting. Smart casual professional attire like a crisp button-down or modern professional top.'
  },
  {
    id: 'outdoor-natural',
    name: 'Natural Light',
    description: 'Warm, approachable look with natural sunlight.',
    icon: <Sun className="w-5 h-5" />,
    prompt: 'Professional headshot with natural outdoor lighting. Softly blurred urban or park background. Warm, golden hour lighting. Approachable yet professional attire.'
  },
  {
    id: 'executive-dark',
    name: 'Executive Dark',
    description: 'Moody, high-contrast professional portrait.',
    icon: <Briefcase className="w-5 h-5" />,
    prompt: 'High-end executive headshot with a dark, textured background. Dramatic professional lighting. Formal business attire. Powerful and confident aesthetic.'
  }
];

export default function App() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError("Image size must be less than 4MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setStep(2);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateHeadshot = async () => {
    if (!selectedImage || !selectedStyle) return;

    setIsGenerating(true);
    setError(null);
    setStep(3);

    try {
      // Extract base64 data
      const base64Data = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: `Transform this casual selfie into a professional corporate headshot. 
              CRITICAL: Maintain the person's facial features, identity, and basic likeness exactly. 
              Style requirements: ${selectedStyle.prompt}. 
              Ensure the final image looks like a high-quality professional photography session. 
              Remove any casual background and replace it. 
              Adjust lighting to be professional and flattering. 
              The person should be centered and framed from the chest up.`,
            },
          ],
        },
      });

      let foundImage = false;
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        throw new Error("No image was generated. Please try again.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Failed to generate headshot. Please try again.");
      setStep(2);
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setStep(1);
    setSelectedImage(null);
    setSelectedStyle(null);
    setGeneratedImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Camera className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">AI Headshot Pro</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-500">
            <span className={step === 1 ? "text-indigo-600" : ""}>1. Upload</span>
            <ChevronRight className="w-4 h-4" />
            <span className={step === 2 ? "text-indigo-600" : ""}>2. Style</span>
            <ChevronRight className="w-4 h-4" />
            <span className={step === 3 ? "text-indigo-600" : ""}>3. Result</span>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {/* Step 1: Upload */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto text-center"
            >
              <h1 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
                Professional headshots <br />
                <span className="text-indigo-600">without the studio.</span>
              </h1>
              <p className="text-gray-500 text-lg mb-12 max-w-lg mx-auto">
                Upload a casual selfie and let our AI transform it into a high-quality, 
                professional headshot for your LinkedIn, resume, or website.
              </p>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-gray-300 rounded-3xl p-12 transition-all hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="text-indigo-600 w-8 h-8" />
                  </div>
                  <p className="text-lg font-semibold mb-1">Click to upload your selfie</p>
                  <p className="text-sm text-gray-400">PNG, JPG up to 4MB</p>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                <div className="flex gap-3">
                  <CheckCircle2 className="text-emerald-500 w-5 h-5 shrink-0" />
                  <p className="text-sm text-gray-600">Maintain your likeness</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="text-emerald-500 w-5 h-5 shrink-0" />
                  <p className="text-sm text-gray-600">Professional attire & lighting</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="text-emerald-500 w-5 h-5 shrink-0" />
                  <p className="text-sm text-gray-600">Studio quality results</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Style Selection */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12"
            >
              <div className="lg:col-span-5">
                <div className="sticky top-28">
                  <h2 className="text-3xl font-bold mb-4">Choose your style</h2>
                  <p className="text-gray-500 mb-8">
                    Select the professional aesthetic that best fits your needs.
                  </p>

                  <div className="space-y-3">
                    {STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style)}
                        className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-all text-left ${
                          selectedStyle?.id === style.id 
                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          selectedStyle?.id === style.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {style.icon}
                        </div>
                        <div>
                          <p className="font-semibold">{style.name}</p>
                          <p className="text-xs text-gray-500">{style.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={!selectedStyle || isGenerating}
                    onClick={generateHeadshot}
                    className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                    Generate Headshot
                  </button>
                  
                  {error && (
                    <p className="mt-4 text-red-500 text-sm text-center bg-red-50 p-3 rounded-xl border border-red-100">
                      {error}
                    </p>
                  )}
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                  <div className="aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden relative">
                    {selectedImage ? (
                      <img 
                        src={selectedImage} 
                        alt="Original" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium">
                      Original Photo
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Result */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1 w-full">
                  <div className="relative aspect-[4/5] bg-white p-4 rounded-3xl shadow-xl border border-gray-100">
                    {isGenerating ? (
                      <div className="w-full h-full bg-gray-50 rounded-2xl flex flex-col items-center justify-center gap-4 text-center p-8">
                        <div className="relative">
                          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                          <div className="absolute inset-0 blur-xl bg-indigo-400/20 animate-pulse"></div>
                        </div>
                        <div>
                          <p className="font-bold text-xl mb-2">Generating your headshot...</p>
                          <p className="text-gray-500 text-sm">Our AI is perfecting your professional look. This usually takes 10-20 seconds.</p>
                        </div>
                        {/* Progress bar simulation */}
                        <div className="w-full max-w-xs bg-gray-200 h-1.5 rounded-full overflow-hidden mt-4">
                          <motion.div 
                            initial={{ width: "0%" }}
                            animate={{ width: "95%" }}
                            transition={{ duration: 15, ease: "linear" }}
                            className="h-full bg-indigo-600"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner">
                        <img 
                          src={generatedImage || ''} 
                          alt="Generated Headshot" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-8">
                  <div>
                    <h2 className="text-4xl font-bold mb-4 tracking-tight">Your new headshot is ready!</h2>
                    <p className="text-gray-500">
                      We've transformed your selfie into a professional {selectedStyle?.name.toLowerCase()} portrait.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = generatedImage || '';
                        link.download = `headshot-${selectedStyle?.id}.png`;
                        link.click();
                      }}
                      disabled={isGenerating}
                      className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download Headshot
                    </button>
                    
                    <button
                      onClick={() => setStep(2)}
                      disabled={isGenerating}
                      className="w-full bg-white text-gray-700 border border-gray-200 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Try Another Style
                    </button>

                    <button
                      onClick={reset}
                      disabled={isGenerating}
                      className="w-full text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
                    >
                      Start over with a new photo
                    </button>
                  </div>

                  <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                    <p className="text-indigo-900 font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                      Pro Tip
                    </p>
                    <p className="text-indigo-700/80 text-sm leading-relaxed">
                      For the best results on LinkedIn, use the "Corporate Grey" or "Modern Tech" styles. 
                      They provide the most professional context for recruiters.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-white mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Camera className="w-5 h-5" />
            <span className="font-bold">AI Headshot Pro</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2026 AI Headshot Pro. Powered by Gemini AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
