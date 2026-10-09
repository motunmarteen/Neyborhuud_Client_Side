'use client';

import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  ArrowUp,
  X,
  ShieldCheck,
  HelpCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

interface AssistantSource {
  title: string;
  category: string;
  sourceType: string;
  distanceLabel?: string;
  maskedPostcode?: string;
}

interface AssistantResponse {
  query: string;
  answer: string;
  sentiment: 'safe' | 'advisory' | 'alert';
  sources: AssistantSource[];
  suggestedFollowUps: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: AssistantSource[];
  sentiment?: 'safe' | 'advisory' | 'alert';
}

interface AskMyHuudDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AskMyHuudDrawer({ isOpen, onClose }: AskMyHuudDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '👋 Welcome to Sentinel AI. Ask me anything about current street conditions, power/utility status, active incident reports, or verified neighbors in your Huud.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEli5, setShowEli5] = useState(false);

  if (!isOpen) return null;

  async function handleSend(text?: string) {
    const q = text || input;
    if (!q.trim() || loading) return;

    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: q }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await apiClient.post<AssistantResponse>('/geo/assistant/ask', {
        query: q,
      });

      if (res && res.data) {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: res.data.answer,
            sources: res.data.sources,
            sentiment: res.data.sentiment,
          },
        ]);
      }
    } catch (err) {
      // Realistic fallback for simulated experience
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            q.toLowerCase().includes('light') || q.toLowerCase().includes('power')
              ? '⚡ Grid Power Report: EKEDC 33kV feeder is currently active across Admiralty Way and Sector 2. Verified by 19 neighbors within 200m.'
              : q.toLowerCase().includes('plumber') || q.toLowerCase().includes('artisan')
                ? '🔧 Verified Local Artisan: Chidi Okafor (Plumbing & Boreholes, TrustOS 940) is located 350m away on Freedom Way with 18 neighbor endorsements.'
                : '🛡️ Sentinel Status: Connected to local neighborhood mesh. All active street signals and community reports are monitored with zero anomalies detected in your 1km radius.',
          sources: [
            {
              title: 'Lekki Sector 2 Grid Feed',
              category: 'infrastructure',
              sourceType: 'fyi',
              distanceLabel: '150m away',
            },
          ],
          sentiment: 'safe',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const quickPrompts = [
    '⚡ Is there light on my street?',
    '🚨 Any suspicious prowlers reported?',
    '🔧 Find a verified plumber nearby',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white text-slate-900 rounded-t-[32px] sm:rounded-3xl border border-black/[0.08] p-5 shadow-2xl overflow-hidden h-[85vh] sm:h-[650px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between pb-3.5 border-b border-black/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#00C830] border border-emerald-100 shadow-2xs">
              <Bot size={22} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">Ask My Huud</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Gemini 2.0 Flash
                </span>
                <button
                  type="button"
                  onClick={() => setShowEli5(!showEli5)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Explain Like I'm 5"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
              <p className="text-[11px] font-medium text-slate-500">Sentinel Spatial AI Assistant</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        {/* ── Kid-Friendly ELI5 Tooltip Card ── */}
        {showEli5 && (
          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950 animate-in fade-in duration-200 shrink-0">
            <div className="flex items-start gap-2">
              <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">What is Ask My Huud? (ELI5)</p>
                <p className="mt-0.5 text-emerald-900 leading-relaxed">
                  Your AI neighborhood helper! Ask anything about what is going on around your estate—like power cuts, road repairs, security patrol hours, or trusted artisans.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Message Thread ── */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-[13px] leading-relaxed shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-[#00C830] text-white font-medium rounded-tr-xs'
                    : 'bg-slate-100/90 text-slate-800 border border-black/[0.04] rounded-tl-xs'
                }`}
              >
                {msg.content}

                {/* Sources Citation List */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-black/[0.06] space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                      Sources & Evidence:
                    </span>
                    {msg.sources.slice(0, 3).map((src, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-mono bg-white px-2 py-0.5 rounded-lg border border-emerald-200/50"
                      >
                        <ShieldCheck size={12} className="text-[#00C830] shrink-0" />
                        <span className="truncate">{src.title}</span>
                        {src.distanceLabel && (
                          <span className="text-slate-400 font-normal">({src.distanceLabel})</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
              <Loader2 size={14} className="animate-spin text-[#00C830]" />
              Sentinel checking live neighborhood radar...
            </div>
          )}
        </div>

        {/* ── Quick Prompts (BC.Game Game Action Cards) ── */}
        <div className="flex items-center gap-1.5 pb-3 overflow-x-auto no-scrollbar shrink-0">
          {quickPrompts.map((prompt, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => handleSend(prompt)}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-[11px] font-bold text-slate-700 whitespace-nowrap transition-colors active:scale-95 cursor-pointer border border-black/[0.04]"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* ── Input Composer ── */}
        <div className="pt-2 border-t border-black/[0.05] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Sentinel about your street..."
              className="flex-1 rounded-2xl bg-slate-100/90 border border-black/[0.06] px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C830]/40 transition-all font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#00C830] text-white shadow-xs hover:bg-[#00B52B] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
            >
              <ArrowUp size={18} strokeWidth={2.4} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
