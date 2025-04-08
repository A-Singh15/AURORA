"use client"

import { useState, useRef, useEffect, JSX } from "react"
import { chatWithOpenRouter } from "@/lib/router"
import { getTopSpotifyTrack } from "@/lib/spotfiy"
import { SmilePlus, UploadCloud, Sun, Moon } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { motion } from "framer-motion"
import EmojiPicker from "emoji-picker-react"

const GIPHY_API_KEY = "88UqHcP1hH2kQu14cDJbdmu3zguPUxME"

async function fetchGifFromGiphy(query: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(query)}&api_key=${GIPHY_API_KEY}&limit=1`)
    const data = await res.json()
    return data?.data?.[0]?.images?.downsized_medium?.url || null
  } catch (e) {
    console.error("GIF fetch error:", e)
    return null
  }
}

async function formatMessage(content: string, isAssistant: boolean): Promise<JSX.Element[]> {
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g
  const parts: JSX.Element[] = []
  let lastIndex = 0

  for (const match of content.matchAll(imageRegex)) {
    const [fullMatch, alt, url] = match
    const index = match.index ?? 0
    if (index > lastIndex) {
      const before = content.slice(lastIndex, index)
      parts.push(<ReactMarkdown key={`text-${index}`}>{before}</ReactMarkdown>)
    }
    const gifUrl = url.startsWith("http") ? url : await fetchGifFromGiphy(alt)
    if (gifUrl) {
      parts.push(
        <img key={`img-${index}`} src={gifUrl} alt={alt} className="my-2 rounded-md max-w-xs border" />
      )
    }
    lastIndex = index + fullMatch.length
  }

  if (lastIndex < content.length) {
    parts.push(<ReactMarkdown key="last-text">{content.slice(lastIndex)}</ReactMarkdown>)
  }

  const musicKeywords = ["play", "music", "track", "song", "recommend"]
  if (isAssistant && musicKeywords.some(w => content.toLowerCase().includes(w))) {
    const trackId = await getTopSpotifyTrack(content)
    if (trackId) {
      parts.push(
        <iframe
          key="spotify-embed"
          style={{ borderRadius: "12px", marginTop: "10px" }}
          src={`https://open.spotify.com/embed/track/${trackId}`}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      )
    }
  }

  return parts
}

export default function EmotionAIChat() {
  const [messages, setMessages] = useState([{ role: "system", content: "You are an emotion therapist who gives short, supportive replies (under 50 words). Use markdown image syntax with alt text like ![calm]()." }])
  const [input, setInput] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [renderedMessages, setRenderedMessages] = useState<JSX.Element[][]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const toggleTheme = () => setDarkMode(!darkMode)

  const onSubmit = async () => {
    const trimmed = input.trim()
    if (!trimmed && files.length === 0) return

    const newMessages = [...messages, { role: "user", content: trimmed }]
    setMessages(newMessages)
    setInput("")
    setFiles([])
    setLoading(true)
    setIsTyping(true)

    try {
      const res = await chatWithOpenRouter(newMessages)
      const reply = res?.choices?.[0]?.message?.content ?? "Sorry, I couldn't understand that."
      await new Promise(resolve => setTimeout(resolve, 1200))
      setMessages([...newMessages, { role: "assistant", content: reply }])
    } catch (e) {
      console.error("Chat error:", e)
      setMessages([...newMessages, { role: "assistant", content: "Something went wrong. Please try again." }])
    }

    setLoading(false)
    setIsTyping(false)
    inputRef.current?.focus()
  }

  useEffect(() => {
    const processMessages = async () => {
      const formatted = await Promise.all(messages.slice(1).map((msg) => formatMessage(msg.content, msg.role === "assistant")))
      setRenderedMessages(formatted)
    }
    processMessages()
  }, [messages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
      setTimeout(() => {
        window.scrollBy({ top: -80, behavior: "smooth" })
      }, 400)
    }
  }, [renderedMessages])

  useEffect(() => {
    const handleClickAnywhere = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isInteractive = target.closest("input, button, .emoji-picker-react, label, svg")
      if (!isInteractive) {
        inputRef.current?.focus()
        scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
      }
    }
    window.addEventListener("click", handleClickAnywhere)
    return () => window.removeEventListener("click", handleClickAnywhere)
  }, [])

  return (
    <div className={`${darkMode ? 'dark bg-zinc-900 text-white' : 'bg-white text-gray-900'} transition-colors duration-500 min-h-screen flex flex-col`}>
      {/* Header */}
<main className="flex flex-col min-h-screen justify-start px-6 md:px-12 xl:px-24 w-full">
        <section className="w-full min-h-[30vh] flex flex-col justify-center items-center px-4 text-center mt-8">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text"
          >
            Hello AURORA⁺
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-2 text-gray-400 text-base md:text-lg"
          >
            Your emotional assistant is here 💬
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            onClick={toggleTheme}
            className="mt-6 px-6 py-3 rounded-full text-base font-medium shadow bg-slate-200 dark:bg-slate-800 text-black dark:text-white flex items-center"
          >
            {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </motion.button>
        </section>

        {/* Chat Messages */}
<div className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-6 md:px-10 xl:px-16 mt-4">
          {renderedMessages.map((parts, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`mb-4 ${messages[idx + 1]?.role === "user" ? "text-right" : "text-left"}`}
            >
              <div
                className={`inline-block max-w-[80%] px-4 py-3 rounded-2xl shadow-lg whitespace-pre-wrap ${
                  messages[idx + 1]?.role === "user"
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-800 dark:text-white"
                    : "bg-green-100 text-green-900 dark:bg-green-800 dark:text-white"
                }`}
              >
                {parts.map((part, i) => <div key={i}>{part}</div>)}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div className="mb-4 text-left" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="inline-block max-w-[90%] md:max-w-[75%] xl:max-w-[65%] px-4 py-3 bg-green-100 text-green-900 dark:bg-green-800 dark:text-white rounded-2xl shadow">
                <span className="typing-dots">AURORA⁺ is typing</span>
              </div>
            </motion.div>
          )}
          <div ref={scrollRef} />
        </div>
      </main>

      {/* Input */}
      <div className="w-full bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700 py-4 px-4 sticky bottom-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-yellow-500">
            <SmilePlus className="w-5 h-5" />
          </button>
          <label htmlFor="file-upload" className="cursor-pointer text-blue-500 flex items-center">
            <UploadCloud className="w-5 h-5 mr-1" /> Upload
          </label>
          <input
            type="file"
            multiple
            onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))}
            className="hidden"
            id="file-upload"
          />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            placeholder="How are you feeling?"
            className="flex-1 px-4 py-3 border rounded-xl shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white dark:border-gray-600"
          />
          <button
            onClick={onSubmit}
            disabled={loading || (!input.trim() && files.length === 0)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            Send
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-14 left-0 z-50">
              <EmojiPicker onEmojiClick={(emojiData) => setInput((prev) => prev + emojiData.emoji)} />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .typing-dots::after {
          content: '...';
          animation: blink 1s steps(1, end) infinite;
        }
        @keyframes blink {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
