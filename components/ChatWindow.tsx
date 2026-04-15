'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Message } from '@/types/chat';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import Sidebar, { type ChatSummary } from './Sidebar';

export default function ChatWindow() {
  const GREETINGS = [
    'What can I help you with today?',
    'What shall we think through?',
    "What's on your mind?",
    'How can I assist you?',
    'What are you curious about?',
    "Let's figure it out together.",
    'Ask me anything.',
    'What would you like to explore?',
  ];

  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [greeting, setGreeting] = useState(GREETINGS[0]);

  useEffect(() => {
    setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cancelTypingRef = useRef<() => void>(() => {});

  // Load chat list when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
    } else {
      setChats([]);
      setCurrentChatId(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats');
      setChats(await res.json());
    } catch (e) {
      console.error('Failed to fetch chats', e);
    }
  };

  const handleNewChat = () => {
    cancelTypingRef.current();
    setMessages([]);
    setCurrentChatId(null);
  };

  const handleSelectChat = async (id: string) => {
    if (id === currentChatId) return;
    cancelTypingRef.current();
    try {
      const res = await fetch(`/api/chats/${id}`);
      const data = await res.json();
      setCurrentChatId(id);
      setMessages(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.messages.map((m: any) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))
      );
    } catch (e) {
      console.error('Failed to load chat', e);
    }
  };

  const handleDeleteChat = async (id: string) => {
    try {
      await fetch(`/api/chats/${id}`, { method: 'DELETE' });
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (currentChatId === id) handleNewChat();
    } catch (e) {
      console.error('Failed to delete chat', e);
    }
  };

  const sendMessage = useCallback(
    async (text: string, file?: File) => {
      if (isLoading || (!text.trim() && !file)) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text.trim(),
        file: file
          ? { name: file.name, type: file.type, dataUrl: URL.createObjectURL(file) }
          : undefined,
      };

      const assistantPlaceholder: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        isStreaming: true,
      };

      const historyWithUser = [...messages, userMessage];
      setMessages([...historyWithUser, assistantPlaceholder]);
      setIsLoading(true);

      // Create a new chat in the DB on the first message — only when authenticated
      let chatId = currentChatId;
      if (!chatId && isAuthenticated) {
        try {
          const res = await fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: text.trim().slice(0, 60) || 'New Chat' }),
          });
          const newChat: ChatSummary = await res.json();
          chatId = newChat.id;
          setCurrentChatId(chatId);
          setChats((prev) => [newChat, ...prev]);
        } catch (e) {
          console.error('Failed to create chat', e);
        }
      }

      try {
        const formData = new FormData();
        formData.append(
          'messages',
          JSON.stringify(historyWithUser.map((m) => ({ role: m.role, content: m.content })))
        );
        if (file) formData.append('file', file);

        const response = await fetch('/api/chat', { method: 'POST', body: formData });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
          throw new Error(err.error ?? `HTTP ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        let typingBuffer = '';
        let apiDone = false;
        let fullContent = '';
        let displayedContent = '';
        let cancelled = false;
        let rafId = 0;

        cancelTypingRef.current = () => {
          cancelled = true;
          cancelAnimationFrame(rafId);
        };

        const typeFrame = () => {
          if (cancelled) return;

          if (typingBuffer.length > 0) {
            const charsThisFrame =
              typingBuffer.length > 80 ? 4 : typingBuffer.length > 30 ? 2 : 1;
            displayedContent += typingBuffer.slice(0, charsThisFrame);
            typingBuffer = typingBuffer.slice(charsThisFrame);

            const snapshot = displayedContent;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], content: snapshot };
              return updated;
            });
          }

          if (!apiDone || typingBuffer.length > 0) {
            rafId = requestAnimationFrame(typeFrame);
          } else {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], isStreaming: false };
              return updated;
            });
          }
        };

        rafId = requestAnimationFrame(typeFrame);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          typingBuffer += chunk;
          fullContent += chunk;
        }
        apiDone = true;

        // Persist to DB only when authenticated
        if (chatId && isAuthenticated) {
          const payload = [
            ...historyWithUser.map((m) => ({ role: m.role, content: m.content })),
            { role: 'assistant', content: fullContent },
          ];
          const saved = await fetch(`/api/chats/${chatId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: payload }),
          });
          const updated: ChatSummary = await saved.json();
          setChats((prev) => [updated, ...prev.filter((c) => c.id !== updated.id)]);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'An unexpected error occurred.';
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: `**Error:** ${msg}`,
            isStreaming: false,
          };
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, currentChatId, isAuthenticated]
  );

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar — always mounted, width animates open/closed */}
      <div
        className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onClose={() => setIsSidebarOpen(false)}
          session={session}
          authStatus={status}
        />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-6 h-[65px] border-b border-gray-800 bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <>
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  title="Open sidebar"
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                </button>
                <h1 className="text-white font-semibold text-lg">Chatbot</h1>
              </>
            )}
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="text-gray-500 hover:text-gray-300 transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800"
            >
              Clear
            </button>
          )}
        </header>

        {/* Content area */}
        <div className="flex-1 relative overflow-hidden">

          <div
            className={`absolute inset-x-0 z-10 flex justify-center px-6 transition-all duration-500 ease-in-out pointer-events-none ${
              messages.length > 0 ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ bottom: messages.length > 0 ? 'calc(50% + 90px)' : 'calc(50% + 56px)' }}
          >
            <h2 className="text-3xl font-semibold bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent text-center">
              {greeting}
            </h2>
          </div>

          <div
            className={`absolute inset-0 overflow-y-auto transition-opacity duration-500 ${
              messages.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="space-y-5 max-w-3xl mx-auto px-4 py-6 pb-[100px]">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div
            className="absolute inset-x-0 z-10 transition-all duration-500 ease-in-out"
            style={{ bottom: messages.length > 0 ? '0' : 'calc(50% - 44px)' }}
          >
            <div className={`mx-auto transition-all duration-500 ${messages.length > 0 ? 'max-w-3xl' : 'max-w-2xl px-4'}`}>
              <ChatInput onSend={sendMessage} isLoading={isLoading} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
