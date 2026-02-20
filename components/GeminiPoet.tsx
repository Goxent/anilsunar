import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Send, Loader2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GeminiPoet: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setOutput('');

    try {
      // In a real app, use a backend proxy to hide the key
      // @ts-ignore
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

      if (!apiKey) {
        setOutput("Please configure the VITE_GEMINI_API_KEY in your .env file to unleash the poet.");
        setIsLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = "You are Goxent's digital twin. You are a CA student who loves poetry and rap. Write a short, creative 4-line poem or rap verse about the user's topic that mixes financial/accounting terminology with artistic flair. Keep it classy, clever, and short.";

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
    <section id="ai-interact" className="py-24 bg-luxury-900 border-t border-white/5 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs uppercase tracking-widest mb-6"
        >
          <Sparkles size={14} />
          <span>Powered by Gemini AI</span>
        </motion.div>

        <motion.h2
          className="text-4xl md:text-6xl font-serif text-white mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          The <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-yellow-200">Digital</span> Poet
        </motion.h2>

        <motion.p
          className="text-slate-400 mb-12 max-w-lg mx-auto text-lg"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Give me a topic, and I'll weave a verse blending the world of finance with rhythm.
        </motion.p>

        <motion.div
          className="max-w-xl mx-auto bg-luxury-950 p-2 rounded-2xl border border-white/10 flex items-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.1)] focus-within:shadow-[0_0_40px_rgba(245,158,11,0.2)] focus-within:border-gold-500/30 transition-all duration-300"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="pl-4 text-gold-500/50">
            <Bot size={24} />
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Topic: e.g., 'Tax Season', 'Balance Sheet'..."
            className="flex-1 bg-transparent border-none outline-none text-white px-4 py-4 placeholder:text-slate-600 font-sans"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt}
            className="bg-gold-500 hover:bg-gold-400 text-luxury-950 font-bold p-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </motion.div>

        <AnimatePresence>
          {output && (
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="glass-card inline-block p-10 rounded-3xl max-w-2xl border border-gold-500/20 relative shadow-2xl">
                <div className="absolute -top-6 -left-6 text-8xl text-gold-500/10 font-serif leading-none">“</div>
                <div className="absolute -bottom-12 -right-6 text-8xl text-gold-500/10 font-serif leading-none rotate-180">“</div>

                <p className="text-xl md:text-3xl text-gold-100 font-serif italic leading-relaxed whitespace-pre-line relative z-10">
                  {output}
                </p>

                <div className="mt-8 flex justify-center">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-gold-500/50 animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gold-500/50 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gold-500/50 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default GeminiPoet;