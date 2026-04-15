'use client';

import { useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import type { Session } from 'next-auth';

export interface ChatSummary {
  id: string;
  title: string;
  updatedAt: string;
}

interface Props {
  chats: ChatSummary[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onClose: () => void;
  session: Session | null;
  authStatus: 'loading' | 'authenticated' | 'unauthenticated';
}

function groupChats(chats: ChatSummary[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);
  const startOfLastWeek = new Date(startOfToday.getTime() - 7 * 86_400_000);

  const groups: { label: string; items: ChatSummary[] }[] = [];

  const bucket = (label: string, items: ChatSummary[]) => {
    if (items.length) groups.push({ label, items });
  };

  bucket('Today', chats.filter((c) => new Date(c.updatedAt) >= startOfToday));
  bucket('Yesterday', chats.filter((c) => new Date(c.updatedAt) >= startOfYesterday && new Date(c.updatedAt) < startOfToday));
  bucket('Previous 7 days', chats.filter((c) => new Date(c.updatedAt) >= startOfLastWeek && new Date(c.updatedAt) < startOfYesterday));
  bucket('Older', chats.filter((c) => new Date(c.updatedAt) < startOfLastWeek));

  return groups;
}

export default function Sidebar({ chats, currentChatId, onSelectChat, onNewChat, onDeleteChat, onClose, session, authStatus }: Props) {
  const [search, setSearch] = useState('');
  const isAuthenticated = authStatus === 'authenticated';

  const filtered = search.trim()
    ? chats.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : chats;

  const groups = groupChats(filtered);

  return (
    <div className="flex flex-col h-full w-72 bg-gray-900 border-r border-gray-800 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-[65px] border-b border-gray-800 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
        </div>

        <span className="text-white font-semibold flex-1">Chatbot</span>

        <button
          onClick={onClose}
          title="Close sidebar"
          className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* New Chat */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {isAuthenticated ? (
        <>
          {/* Search */}
          <div className="px-3 pb-3">
            <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats…"
                className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-500 hover:text-gray-300">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {chats.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-10">No chats yet — start a conversation!</p>
            ) : filtered.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-10">No chats match &ldquo;{search}&rdquo;</p>
            ) : (
              groups.map((group) => (
                <div key={group.label} className="mb-4">
                  <p className="text-xs text-gray-500 font-medium px-2 py-1 uppercase tracking-wide">
                    {group.label}
                  </p>
                  {group.items.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => onSelectChat(chat.id)}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                        chat.id === currentChatId
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      <span className="flex-1 text-sm truncate">{chat.title}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                        title="Delete chat"
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all flex-shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* User info footer */}
          <div className="px-3 pb-3 border-t border-gray-800 pt-3 flex items-center gap-3">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name ?? 'User'}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{session?.user?.name ?? 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              title="Sign out"
              className="text-gray-500 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Empty state for anonymous */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm text-center leading-relaxed">
              Want your chat history saved?
            </p>
          </div>

          {/* Login prompt */}
          <div className="px-3 pb-4 pt-2">
            <div className="rounded-2xl bg-gray-800 p-4 flex flex-col gap-3">
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Sign in to save your conversations and access them from any device.
              </p>
              <button
                onClick={() => signIn('google')}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-900 text-sm font-medium transition-colors"
              >
                {/* Google logo */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
