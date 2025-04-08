"use client"

import { useState, useRef, useEffect, JSX } from "react"
import { chatWithOpenRouter } from "@/lib/router"
import { getTopSpotifyTrack } from "@/lib/spotfiy"
import { Sparkles, SmilePlus, UploadCloud, Sun, Moon, Music2, History } from "lucide-react"
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
        <motion.img
          key={`img-${index}`}
          src={gifUrl}
          alt={alt}
          className="my-4 rounded-md max-w-full w-full md:w-[400px] border shadow-xl"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
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
        <motion.div key="spotify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="my-2">
          <div className="flex items-center space-x-2 text-pink-400 animate-pulse">
            <Music2 className="w-4 h-4" />
            <span>Now Playing</span>
          </div>
          <iframe
            className="mt-1 rounded-xl"
            src={`https://open.spotify.com/embed/track/${trackId}`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          ></iframe>
        </motion.div>
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
  const [showSidebar, setShowSidebar] = useState(true)
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
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [renderedMessages])

  useEffect(() => {
    const handleClickAnywhere = () => inputRef.current?.focus()
    window.addEventListener("click", handleClickAnywhere)
    return () => window.removeEventListener("click", handleClickAnywhere)
  }, [])

  return (
    <div className={`${darkMode ? 'dark bg-zinc-950 text-white' : 'bg-white text-black'} min-h-screen flex`}>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{ x: showSidebar ? 0 : -300 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 h-full w-64 border-r z-40 bg-zinc-900 dark:border-zinc-800 dark:text-white overflow-auto"
      >
        <div className="font-bold text-xl mb-4 flex items-center justify-between p-4">
          <div className="flex items-center">
            <History className="mr-2 w-5 h-5" /> History
          </div>
          <button onClick={() => setShowSidebar(false)} className="text-sm text-blue-400 hover:underline">Hide</button>
        </div>
        <ul className="space-y-4 text-center px-4">
          <li className="cursor-pointer hover:text-blue-400 transition">Feeling Anxious</li>
          <li className="cursor-pointer hover:text-blue-400 transition">Need Motivation</li>
          <li className="cursor-pointer hover:text-blue-400 transition">Feeling Lonely</li>
        </ul>
      </motion.aside>

      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="fixed left-4 top-4 z-50 px-3 py-2 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600"
        >
          Show Menu
        </button>
      )}

      {/* Main */}
      <main className="ml-auto w-full lg:pl-64 flex flex-col min-h-screen justify-between px-4 py-6 max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-6"
        >
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            AURORA⁺ <Sparkles className="inline-block h-6 w-6 animate-pulse ml-2" />
          </h1>
          <p className="mt-2 text-base text-gray-400">Your emotional assistant is here 💬</p>
          <button
            onClick={toggleTheme}
            className="mt-4 inline-flex items-center px-4 py-2 text-sm bg-slate-200 dark:bg-slate-800 text-black dark:text-white rounded-full shadow"
          >
            {darkMode ? <Sun className="h-4 w-4 mr-1" /> : <Moon className="h-4 w-4 mr-1" />} {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </motion.div>

        {/* Chat content */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-240px)] space-y-4 pb-24">
          {renderedMessages.map((parts, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${messages[idx + 1]?.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-6 py-4 rounded-2xl shadow-xl w-full max-w-[90%] whitespace-pre-wrap ${
                  messages[idx + 1]?.role === "user" ? "bg-blue-600 text-white" : "bg-green-700 text-white"
                }`}
              >
                {parts.map((part, i) => <div key={i}>{part}</div>)}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div className="text-left" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="px-5 py-3 bg-green-700 text-white rounded-2xl shadow inline-block animate-pulse">
                AURORA⁺ is typing...
              </div>
            </motion.div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input section */}
        <div className="sticky bottom-0 bg-zinc-950 py-4 w-full">
          <div className="w-full max-w-5xl mx-auto flex items-center gap-3 px-4">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-yellow-400">
              <SmilePlus className="w-6 h-6" />
            </button>
            <input
              type="file"
              multiple
              onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="text-blue-500 flex items-center cursor-pointer">
              <UploadCloud className="w-5 h-5 mr-1" /> Upload
            </label>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              placeholder="How are you feeling?"
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white dark:border-gray-600"
            />
            <button
              onClick={onSubmit}
              disabled={loading || (!input.trim() && files.length === 0)}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50"
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
      </main>
    </div>
  )
}
