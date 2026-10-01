'use client'

import { useChat } from '@ai-sdk/react'
import { Bot, ChevronRight, Plus, SendHorizonal, Square, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Disclaimer } from '@/components/app/page-parts'
import { Button } from '@/components/ui/button'
import { conversations, suggestedPrompts } from '@/lib/data'
import { cn } from '@/lib/utils'

export function ChatView() {
  const [input, setInput] = useState('')
  const [chatKey, setChatKey] = useState(0)
  const { messages, sendMessage, status, stop, error, setMessages } = useChat({ id: `chat-${chatKey}` })
  const busy = status === 'submitted' || status === 'streaming'
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    sendMessage({ text: trimmed })
    setInput('')
  }

  return (
    <div className="grid h-[calc(100dvh-10rem)] gap-4 lg:h-[calc(100dvh-7rem)] lg:grid-cols-[260px_1fr]">
      <aside className="glass-card hidden flex-col gap-3 p-3 lg:flex" aria-label="Conversations">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold">Conversations</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            stop()
            setMessages([])
            setChatKey((k) => k + 1)
          }}
        >
          <Plus aria-hidden="true" />
          New Conversation
        </Button>
        <ul className="flex flex-col gap-1 overflow-y-auto">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => send(c.preview)}
                className="flex w-full items-center gap-2 rounded-lg p-2.5 text-left transition-colors hover:bg-muted"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.title}</span>
                  <span className="block text-xs text-muted-foreground">{c.time}</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="glass-card flex min-h-0 flex-col" aria-label="Chat">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Bot className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-sm font-semibold">AI Medical Chat</h1>
            <p className="text-xs text-muted-foreground">Ask about symptoms, terms, or lab results</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
          {messages.length === 0 ? (
            <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary glow-primary">
                <Bot className="size-6" aria-hidden="true" />
              </span>
              <p className="text-lg font-semibold">How can I help you today?</p>
              <p className="text-sm text-muted-foreground">
                I can explain medical terms, lab values, and reports in plain language.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {messages.map((m) => {
                const isUser = m.role === 'user'
                return (
                  <li key={m.id} className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full',
                        isUser ? 'bg-muted text-foreground' : 'bg-primary/15 text-primary',
                      )}
                    >
                      {isUser ? <User className="size-4" aria-hidden="true" /> : <Bot className="size-4" aria-hidden="true" />}
                      <span className="sr-only">{isUser ? 'You' : 'Assistant'}</span>
                    </span>
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                        isUser
                          ? 'rounded-tr-sm bg-primary text-primary-foreground'
                          : 'rounded-tl-sm border border-border bg-muted/50',
                      )}
                    >
                      {m.parts.map((part, i) =>
                        part.type === 'text' ? (
                          isUser ? (
                            <p key={i} className="whitespace-pre-wrap">
                              {part.text}
                            </p>
                          ) : (
                            <div key={i} className="chat-markdown">
                              <ReactMarkdown>{part.text}</ReactMarkdown>
                            </div>
                          )
                        ) : null,
                      )}
                    </div>
                  </li>
                )
              })}
              {status === 'submitted' && (
                <li className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex gap-1" aria-hidden="true">
                    <span className="size-1.5 animate-bounce rounded-full bg-primary" />
                    <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
                  </span>
                  AI is typing...
                </li>
              )}
            </ul>
          )}
          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              Something went wrong. Please try again.
            </p>
          )}
          <div ref={endRef} />
        </div>

        <div className="flex flex-col gap-3 border-t border-border p-4">
          {messages.length === 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Suggested questions">
              {suggestedPrompts.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => send(p)}
                    className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-primary/15"
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <label htmlFor="chat-input" className="sr-only">
              Type your message
            </label>
            <textarea
              id="chat-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  if (e.nativeEvent.isComposing || e.keyCode === 229) return
                  e.preventDefault()
                  send(input)
                }
              }}
              placeholder="Type your message..."
              className="max-h-40 min-h-11 flex-1 resize-none rounded-xl border border-input bg-muted/40 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            {busy ? (
              <Button type="button" size="icon-lg" variant="outline" onClick={() => stop()} aria-label="Stop generating">
                <Square aria-hidden="true" />
              </Button>
            ) : (
              <Button type="submit" size="icon-lg" disabled={!input.trim()} aria-label="Send message">
                <SendHorizonal aria-hidden="true" />
              </Button>
            )}
          </form>
          <Disclaimer className="hidden sm:flex" />
        </div>
      </section>
    </div>
  )
}
