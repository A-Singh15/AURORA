"use client"

import { useState, useRef, useEffect, JSX } from "react"
import { chatWithOpenRouter } from "@/lib/router"
import { getTopSpotifyTrack } from "@/lib/spotfiy"
import { Sparkles, SmilePlus, UploadCloud, Sun, Moon } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { motion } from "framer-motion"
import EmojiPicker from 'emoji-picker-react'
import DefaultLayout from "@/layouts/default"

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
        <img
          key={`img-${index}`}
          src={gifUrl}
          alt={alt}
          className="my-2 rounded-md max-w-xs border"
        />
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
        // eslint-disable-next-line jsx-a11y/iframe-has-title
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
  }

  useEffect(() => {
    const processMessages = async () => {
      const formatted = await Promise.all(messages.slice(1).map((msg) => formatMessage(msg.content, msg.role === "assistant")))
      setRenderedMessages(formatted)
    }
    processMessages()
  }, [messages])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [renderedMessages])

  // @ts-ignore
  // @ts-ignore
  return (
    <DefaultLayout>
      <div className={`${darkMode ? 'dark bg-zinc-900 text-white' : 'bg-gradient-to-b from-white to-blue-50 text-gray-900'} transition-colors duration-500 min-h-screen px-4 py-8`}>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center py-12"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            Hello, welcome to <span className="font-extrabold">AURORA⁺</span>
            <Sparkles className="inline-block h-5 w-5 text-sky-400 animate-pulse ml-2" />
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your emotional assistant is ready to 💬
          </p>
          <button
            onClick={toggleTheme}
            className="mt-4 inline-flex items-center px-3 py-1 text-sm bg-slate-200 dark:bg-slate-800 text-black dark:text-white rounded-full shadow transition-colors duration-300"
          >
            {darkMode ? <Sun className="h-4 w-4 mr-1" /> : <Moon className="h-4 w-4 mr-1" />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </motion.div>
        {renderedMessages.map((parts, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`mb-4 ${messages[idx + 1]?.role === "user" ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-block max-w-[80%] px-4 py-3 rounded-2xl shadow-lg whitespace-pre-wrap transition-all duration-300 ease-in-out ${
                messages[idx + 1]?.role === "user"
                  ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-700 dark:text-white"
                  : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
              }`}
            >
              {parts.map((part, i) => <div key={i}>{part}</div>)}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <motion.div className="mb-4 text-left" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="inline-block px-4 py-3 bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white rounded-2xl shadow">
              <span className="typing-dots">AURORA⁺ is typing</span>
            </div>
          </motion.div>
        )}

        <div className="w-full max-w-3xl mx-auto mt-6 space-y-2">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, i) => (
                <span key={i} className="bg-gray-200 px-3 py-1 rounded-md text-sm dark:bg-zinc-700 dark:text-white">{file.name}</span>
              ))}
            </div>
          )}
          <div className="relative flex gap-2 items-center">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-yellow-500">
              <SmilePlus className="w-5 h-5" />
            </button>
            <input
              type="file"
              multiple
              onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer text-blue-500 flex items-center">
              <UploadCloud className="w-5 h-5 mr-1" /> Upload
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              placeholder="How are you feeling?"
              className="flex-1 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white dark:border-gray-600"
            />
            <button
              onClick={onSubmit}
              disabled={loading || (!input.trim() && files.length === 0)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
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

        <style>{`
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
    </DefaultLayout>
  )
}
