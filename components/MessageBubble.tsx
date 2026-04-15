'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/types/chat';

interface Props {
  message: Message;
}

function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 animate-message-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Bot avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
          G
        </div>
      )}

      <div className={`max-w-[75%] flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* File attachment preview */}
        {message.file && (
          <div className="rounded-2xl overflow-hidden border border-gray-700">
            {message.file.type.startsWith('image/') ? (
              <img
                src={message.file.dataUrl}
                alt={message.file.name}
                className="max-w-xs max-h-64 object-contain bg-gray-900"
              />
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 text-gray-300 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="max-w-[200px] truncate">{message.file.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Message bubble */}
        {(message.content || message.isStreaming) && (
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? 'bg-blue-600 text-white rounded-br-sm whitespace-pre-wrap'
                : 'bg-gray-800 text-gray-100 rounded-bl-sm'
            }`}
          >
            {isUser ? (
              message.content
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  pre: ({ children }) => (
                    <pre className="bg-gray-900 p-3 rounded-lg overflow-x-auto my-2 text-xs">{children}</pre>
                  ),
                  code: ({ children, className }) => (
                    <code
                      className={
                        className
                          ? 'font-mono text-gray-200'
                          : 'bg-gray-900 px-1.5 py-0.5 rounded font-mono text-blue-300 text-xs'
                      }
                    >
                      {children}
                    </code>
                  ),
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="ml-2">{children}</li>,
                  h1: ({ children }) => <h1 className="text-base font-bold mb-1 mt-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-bold mb-1 mt-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>,
                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                  em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-blue-400 underline hover:text-blue-300"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-gray-600 pl-3 italic text-gray-400 my-2">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="border-gray-700 my-3" />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}

            {/* Loading dots when empty + streaming */}
            {message.isStreaming && !message.content && (
              <span className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )}

            {/* Blinking cursor while streaming */}
            {message.isStreaming && message.content && (
              <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
          U
        </div>
      )}
    </div>
  );
}

export default memo(MessageBubble);
