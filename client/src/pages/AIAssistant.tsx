import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errorMessage';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Show me my hottest leads',
  'Which deals are likely to close this month?',
  'Who has the highest sales performance?',
  'Find inactive opportunities',
];

export function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm your AI sales assistant. Ask me about your leads, deals, pipeline, or team performance." },
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = useMutation({
    mutationFn: async (message: string) =>
      (await api.post('/ai/chat', { message, conversationId })).data as { conversationId: string; message: { content: string } },
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message.content }]);
    },
    onError: (err: unknown) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: getApiErrorMessage(err, 'Something went wrong. Please try again.') }]);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function submit(text: string) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    send.mutate(text);
    setInput('');
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-8 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-600" />
          <h1 className="text-lg font-bold text-slate-900">AI Assistant</h1>
        </div>
        <p className="text-sm text-slate-500">Ask natural-language questions about your CRM data.</p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-8 py-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-lg rounded-lg px-4 py-2.5 text-sm ${
                m.role === 'user' ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-800'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {send.isPending && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-400">Thinking…</div>
          </div>
        )}
      </div>

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 px-8 pb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex items-center gap-2 border-t border-slate-200 bg-white px-8 py-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your leads, deals, or pipeline…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button type="submit" disabled={send.isPending} className="rounded-md bg-brand-600 p-2.5 text-white hover:bg-brand-700 disabled:opacity-60">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
