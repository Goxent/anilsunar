import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Send, Loader2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Typing Animation component for the AI output
const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(intervalId);
      }
    }, 20); // typing speed
    return () => clearInterval(intervalId);
  }, [text]);

  return <span className="whitespace-pre-wrap">{displayedText}</span>;
}


const GeminiPoet: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setOutput('');

    try {
      // @ts-ignore
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

      if (!apiKey) {
        setOutput("Please configure the VITE_GEMINI_API_KEY in your .env file to unleash the poet.");
        setIsLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = "You are Goxent's digital twin. You are a UI/UX designer, Tech Enthusiast, Auditor and Poet. Write a short, creative 4-line poem or rap verse about the user's topic that mixes tech/finance terminology with artistic flair. Keep it classy, clever, and short.";

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
        config: {
          systemInstruction,
        }
      });

      setOutput(response.text || 'Could not generate a poem. Try again!');
    } catch (error) {
      console.error(error);
      setOutput("My creative ink is dry right now. Please check the API key or try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="ai-interact" className="py-32 bg-luxury-950 border-t border-white/5 relative overflow-hidden">
      {/* AI Background Aura - Simplified */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full transition-all duration-1000 blur-[20px] pointer-events-none ${isFocused ? 'opacity-100 scale-110' : 'opacity-50 scale-100'}`}
      ></div>

      <div className="max-w-4xl mx-auto px-6 relative z-10 flex flex-col items-center">

        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-gold-400 text-xs uppercase tracking-[0.2em] mb-8 shadow-md">
          <Sparkles size={14} className="animate-pulse" />
          <span className="font-semibold">Gemini 2.0 AI Core</span>
        </div>

        {/* Title */}
        <h2 className="text-5xl md:text-7xl font-serif text-white mb-6 text-center leading-tight tracking-tight">
          Converse with <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-yellow-600">Goxent's Digital Twin</span>
        </h2>

        <p className="text-slate-400 mb-16 max-w-xl mx-auto text-center text-lg md:text-xl font-light leading-relaxed">
          Drop a topic below. I'll synthesize tech logic, financial precision, and poetic rhythm into a unique verse just for you.
        </p>

        {/* Input Area */}
        <div
          className={`w-full max-w-2xl bg-luxury-900/50 p-2.5 rounded-3xl border transition-all duration-500 flex items-center gap-3 relative z-20 ${isFocused
              ? 'border-gold-500/50 bg-luxury-900/80 shadow-lg'
              : 'border-white/10 shadow-md'
            }`}
          onClick={() => inputRef.current?.focus()}
        >
          <div className="pl-5">
            <Bot size={24} className={`transition-colors duration-500 ${isFocused ? 'text-gold-400' : 'text-slate-500'}`} />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="E.g., The intersection of design and audit..."
            className="flex-1 bg-transparent border-none outline-none text-white px-2 py-4 placeholder:text-slate-500 text-lg font-light w-full"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />

          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt}
            className={`p-4 rounded-2xl transition-all duration-300 flex items-center justify-center min-w-[56px] ${prompt && !isLoading
                ? 'bg-gold-500 text-luxury-950 hover:bg-gold-400 hover:scale-105 active:scale-95'
                : 'bg-white/5 text-slate-500 cursor-not-allowed'
              }`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={22} /> : <Send size={22} className={prompt ? "translate-x-0.5 -translate-y-0.5" : ""} />}
          </button>
        </div>

        {/* AI Output Area */}
        <div className="w-full max-w-2xl mt-8 min-h-[200px] flex flex-col items-center">
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 text-gold-500/70"
              >
                <Loader2 className="animate-spin" size={20} />
                <span className="text-sm tracking-widest uppercase font-semibold">Synthesizing...</span>
              </motion.div>
            )}

            {output && !isLoading && (
              <motion.div
                key="output"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <div className="bg-luxury-900/40 border border-white/5 p-8 md:p-10 rounded-[32px] relative shadow-lg overflow-hidden group">
                  <div className="flex gap-6 items-start">
                    <div className="shrink-0 p-3 bg-white/5 rounded-2xl border border-white/10">
                      <Sparkles className="text-gold-400" size={24} />
                    </div>

                    <div className="flex-1 pt-2">
                      <p className="text-lg md:text-xl text-slate-200 font-serif leading-loose relative z-10">
                        <TypewriterText text={output} />
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

export default GeminiPoet;