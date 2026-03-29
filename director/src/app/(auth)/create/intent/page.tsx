'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useWizard } from '@/context/WizardContext';
import {
  getApiKeys,
  getSelectedModel,
} from '@/lib/apiKeyStore';

const OPENROUTER_MODEL_NAMES: Record<string, string> = {
  'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
  'anthropic/claude-sonnet-4': 'Claude Sonnet 4',
  'minimax/minimax-m2.7': 'MiniMax M2.7',
  'minimax/minimax-m2.5': 'MiniMax M2.5',
  'minimax/minimax-m2-her': 'MiniMax M2-Her',
  'mistralai/mistral-small-creative': 'Mistral Creative',
  'reka/reka-edge': 'Reka Edge',
  'minimax/minimax-m2.5:free': 'MiniMax M2.5 Free',
  'meta-llama/llama-4-maverick:free': 'Llama 4 Maverick',
  'deepseek/deepseek-chat-v3-0324:free': 'DeepSeek V3',
  'qwen/qwen3-235b-a22b:free': 'Qwen3 235B',
  'google/gemma-3-27b-it:free': 'Gemma 3 27B',
};

// ─── Types ──────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface DirectorBrief {
  title: string;
  contentType: string;
  targetAudience: string;
  mood: string;
  persona: number;
  colorIndex: number;
  pacing: 'quick' | 'balanced' | 'slow';
  lighting: 'warm' | 'cool' | 'high-contrast' | 'mood';
  cameraMotion: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  soundtrack: string;
  scenes: {
    id: string;
    title: string;
    description: string;
    shotType: string;
    duration: number;
  }[];
  voiceoverScript: string;
  summary: string;
}

// ─── Parse brief from assistant message ─────────────────────────────

function parseBrief(content: string): DirectorBrief | null {
  const match = content.match(/---DIRECTOR_BRIEF---\s*([\s\S]*?)\s*---END_BRIEF---/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as DirectorBrief;
  } catch {
    return null;
  }
}

function stripBriefBlock(content: string): string {
  return content.replace(/---DIRECTOR_BRIEF---[\s\S]*?---END_BRIEF---/, '').trim();
}

// ─── Component ──────────────────────────────────────────────────────

export default function IntentPage() {
  const { update } = useWizard();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [brief, setBrief] = useState<DirectorBrief | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // LLM model state
  const [llmModel, setLlmModel] = useState('');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [missingKey, setMissingKey] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load LLM provider settings — runs on mount and when window regains focus
  const loadProviderSettings = useCallback(() => {
    const model = getSelectedModel();
    const keys = getApiKeys();
    setLlmModel(model);
    setLlmApiKey(keys.openrouter);

    if (keys.openrouter) {
      setMissingKey(false);
    } else {
      fetch('/api/keys')
        .then((r) => r.json())
        .then((data) => {
          setMissingKey(!data.openrouter?.configured);
        })
        .catch(() => setMissingKey(true));
    }
  }, []);

  useEffect(() => {
    loadProviderSettings();
    // Re-check when user returns from settings page
    window.addEventListener('focus', loadProviderSettings);
    return () => window.removeEventListener('focus', loadProviderSettings);
  }, [loadProviderSettings]);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ─── Send message to Director AI ───────────────────────────────

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isStreaming) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userText.trim(),
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput('');
      setIsStreaming(true);

      // Create assistant placeholder
      const assistantId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        const controller = new AbortController();
        abortRef.current = controller;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            model: llmModel,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Chat failed' }));
          throw new Error(err.error || 'Chat failed');
        }

        // Read SSE stream
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        if (reader) {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') break;

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullContent += parsed.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: fullContent } : m,
                    ),
                  );
                }
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                if (e instanceof SyntaxError) continue;
                throw e;
              }
            }
          }
        }

        // Check if the response contains a brief
        const detected = parseBrief(fullContent);
        if (detected) {
          setBrief(detected);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // User cancelled — remove empty assistant message
          setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content));
        } else {
          const msg = err instanceof Error ? err.message : 'Chat failed';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `Error: ${msg}. Check your OpenRouter API key in Settings.` }
                : m,
            ),
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        inputRef.current?.focus();
      }
    },
    [messages, isStreaming, llmApiKey, llmModel],
  );

  // ─── Execute: Apply brief to wizard and navigate ──────────────

  const executeBrief = useCallback(async () => {
    if (!brief) return;
    setIsExecuting(true);

    // Build the full vision text from the conversation
    const visionText = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join(' ');

    // Build scene objects for WizardContext
    const scenes = brief.scenes.map((s, i) => ({
      id: s.id,
      prompt: s.description,
      status: 'pending' as const,
      imageUrl: null,
      predictionId: null,
      error: null,
      sceneIndex: i,
      videoMotionPrompt: `${brief.cameraMotion} camera movement, ${brief.mood} atmosphere, cinematic continuity`,
    }));

    // Apply everything to wizard state
    update({
      visionText: `${brief.title}: ${brief.summary}\n\n${visionText}`,
      selectedPersona: brief.persona,
      colorIndex: brief.colorIndex,
      pacing: brief.pacing,
      lighting: brief.lighting,
      cameraMotion: brief.cameraMotion,
      aspectRatio: brief.aspectRatio,
      selectedSoundtrack: brief.soundtrack,
      voiceoverScript: brief.voiceoverScript || '',
      scenes,
    });

    // Small delay for state to settle
    await new Promise((r) => setTimeout(r, 300));
    setIsExecuting(false);

    // Navigate to review page (skip brief + style-dna since agent filled them)
    router.push('/create/brief');
  }, [brief, messages, update, router]);

  // ─── Handle submit ────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ─── Starter prompts ─────────────────────────────────────────

  const starters = [
    'A 60-second Instagram ad for my activewear brand',
    'A cinematic product reveal for a luxury watch',
    'A 3-minute short film about solitude in a big city',
    'A real estate walkthrough for a modern penthouse',
    'A TikTok series for a new coffee brand launch',
  ];

  // ─── Render ───────────────────────────────────────────────────

  const COLOR_NAMES = ['Action Orange', 'Electric Blue', 'Cyber Purple', 'Neon Pink', 'Matrix Green'];
  const PERSONA_NAMES = ['', 'Modern Professional', 'Gen Z Trendsetter', 'Luxury Seeker', 'Small Business Owner'];

  return (
    <main className="flex-grow flex flex-col h-[calc(100vh-64px)] relative overflow-hidden">
      {/* Background ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="text-center py-6 z-10 shrink-0">
        <span className="text-primary font-headline font-bold text-xs uppercase tracking-[0.2em]">
          Director AI Agent
        </span>
        <h1 className="font-headline font-extrabold text-2xl md:text-3xl tracking-tight text-white mt-1">
          What&apos;s the <span className="text-gradient-primary">Vision?</span>
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Tell me your idea. I&apos;ll develop it into a shootable concept.
        </p>
        {/* Provider indicator */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400">
            <span className="material-symbols-outlined text-xs">route</span>
            {OPENROUTER_MODEL_NAMES[llmModel] || llmModel || 'OpenRouter'}
          </span>
        </div>
      </div>

      {/* Missing key warning */}
      {missingKey && (
        <div className="mx-auto max-w-3xl px-4 z-10">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-yellow-400 mt-0.5">warning</span>
            <div>
              <p className="text-sm font-bold text-yellow-300">
                No OpenRouter API key configured
              </p>
              <p className="text-xs text-yellow-300/70 mt-1">
                Add your API key in{' '}
                <Link href="/settings" className="underline hover:text-yellow-200">
                  Settings &rarr; API Keys
                </Link>{' '}
                to start chatting.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-0 z-10">
        <div className="max-w-3xl mx-auto space-y-4 pb-4">
          {/* Empty state — starter chips */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-6 py-12">
              <div className="flex items-center gap-2 text-on-surface-variant/50">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  movie_filter
                </span>
                <span className="text-sm font-medium">Start with an idea</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                {starters.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="bg-surface-container-highest text-on-surface-variant hover:text-white hover:bg-surface-bright px-4 py-2 rounded-full text-sm font-medium transition-all border border-outline-variant/10"
                  >
                    &quot;{s}&quot;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-on-primary rounded-br-md'
                    : 'bg-surface-container-high text-on-surface rounded-bl-md'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="space-y-2">
                    {/* Show text portion (strip the JSON brief) */}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {stripBriefBlock(msg.content) || (
                        <span className="inline-flex items-center gap-1 text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm animate-spin">
                            progress_activity
                          </span>
                          Thinking...
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Brief card — shown when agent produces a brief */}
          {brief && (
            <div className="bg-surface-container-low border border-primary/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    movie_filter
                  </span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-white">{brief.title}</h3>
                  <p className="text-xs text-on-surface-variant">{brief.contentType} &middot; {brief.targetAudience}</p>
                </div>
              </div>

              <p className="text-sm text-on-surface-variant leading-relaxed">{brief.summary}</p>

              {/* Style DNA preview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-surface-container-highest rounded-lg p-2 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 block">Mood</span>
                  <span className="text-xs font-bold text-white">{brief.mood}</span>
                </div>
                <div className="bg-surface-container-highest rounded-lg p-2 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 block">Color</span>
                  <span className="text-xs font-bold text-white">{COLOR_NAMES[brief.colorIndex]}</span>
                </div>
                <div className="bg-surface-container-highest rounded-lg p-2 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 block">Pacing</span>
                  <span className="text-xs font-bold text-white capitalize">{brief.pacing}</span>
                </div>
                <div className="bg-surface-container-highest rounded-lg p-2 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 block">Persona</span>
                  <span className="text-xs font-bold text-white">{PERSONA_NAMES[brief.persona]}</span>
                </div>
              </div>

              {/* Scene breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {brief.scenes.length} Scenes
                </h4>
                <div className="grid gap-2">
                  {brief.scenes.map((scene, i) => (
                    <div
                      key={scene.id}
                      className="flex items-start gap-3 bg-surface-container-highest rounded-lg p-3"
                    >
                      <span className="text-xs font-mono text-primary font-bold mt-0.5 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block">{scene.title}</span>
                        <span className="text-[11px] text-on-surface-variant/70 line-clamp-2">
                          {scene.description}
                        </span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant/50 shrink-0 mt-0.5">
                        {scene.shotType} &middot; {scene.duration}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execute button */}
              <button
                onClick={executeBrief}
                disabled={isExecuting}
                className="w-full bg-gradient-to-br from-primary to-primary-container py-4 rounded-xl text-on-primary font-headline font-black text-lg shadow-lg hover:shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    LOADING VISION...
                  </>
                ) : (
                  <>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      rocket_launch
                    </span>
                    EXECUTE VISION
                  </>
                )}
              </button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-outline-variant/10 bg-surface/80 backdrop-blur-xl z-10">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-end gap-3 px-4 py-4"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={messages.length === 0 ? 'Describe your vision...' : 'Reply to the Director...'}
            rows={1}
            className="flex-1 bg-surface-container-highest border border-outline-variant/20 rounded-xl text-sm px-4 py-3 text-white placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 resize-none max-h-32 overflow-y-auto"
            style={{ minHeight: '48px' }}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="shrink-0 bg-error/80 hover:bg-error text-white p-3 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-xl">stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="shrink-0 bg-primary hover:bg-primary-container text-on-primary p-3 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-xl">send</span>
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
