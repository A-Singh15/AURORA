"use client"

import {useState, useRef, useEffect, JSX} from "react"
import { chatWithOpenRouter } from "@/lib/router"
import { Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { motion } from "framer-motion"

const GIPHY_API_KEY = "88UqHcP1hH2kQu14cDJbdmu3zguPUxME"
const SPOTIFY_CLIENT_ID = "9ecfdc17e1e84f5a995308454c4ac29a"
const SPOTIFY_CLIENT_SECRET = "303180beb0ed4a20a17c5135a85ee419"

async function fetchGifFromGiphy(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(query)}&api_key=${GIPHY_API_KEY}&limit=1`
    )
    const data = await res.json()
    return data?.data?.[0]?.images?.downsized_medium?.url || null
  } catch (e) {
    console.error("GIF fetch error:", e)
    return null
  }
}

async function getSpotifyToken(): Promise<string | null> {
  const creds = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    })
    const data = await res.json()
    return data.access_token || null
  } catch (e) {
    console.error("Spotify token error:", e)
    return null
  }
}

async function getTopSpotifyTrack(query: string): Promise<string | null> {
  const token = await getSpotifyToken()
  if (!token) return null

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    const data = await res.json()
    const track = data?.tracks?.items?.[0]
    return track ? track.id : null
  } catch (e) {
    console.error("Spotify search error:", e)
    return null
  }
}

async function formatMessage(content: string, isAssistant: boolean): Promise<JSX.Element[]> {
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g
  const parts: JSX.Element[] = []
  let lastIndex = 0

  // Handle GIFs
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

  // Handle Spotify iframe only for assistant messages
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
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "You are an emotion therapist who gives short, supportive replies (under 50 words). Use markdown image syntax with alt text like ![calm]().",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [renderedMessages, setRenderedMessages] = useState<JSX.Element[][]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const onSubmit = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    const newMessages = [...messages, { role: "user", content: trimmed }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)
    setIsTyping(true)

    try {
      const res = await chatWithOpenRouter(newMessages)
      const reply = res?.choices?.[0]?.message?.content ?? "Sorry, I couldn't understand that."
      await new Promise(resolve => setTimeout(resolve, 1200))
      setMessages([...newMessages, { role: "assistant", content: reply }])
    } catch (e) {
      console.error("Chat error:", e)
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ])
    }

    setLoading(false)
    setIsTyping(false)
  }

  useEffect(() => {
    const processMessages = async () => {
      const formatted = await Promise.all(
        messages.slice(1).map((msg) => formatMessage(msg.content, msg.role === "assistant"))
      )
      setRenderedMessages(formatted)
    }
    processMessages()
  }, [messages])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [renderedMessages])

  return (
    <div className="flex flex-col min-h-screen bg-white px-4 py-8">
      <div className="text-center mb-6">
        <div className="flex justify-center items-center mb-2">
          <Sparkles className="h-5 w-5 mr-2 text-sky-500 animate-pulse" />
          <span className="text-xs font-semibold text-sky-500 uppercase tracking-wide">
            Your Emotion Support Assistant
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Talk to <span className="text-blue-500">AURORA⁺</span> </h1>
        <p className="text-sm text-gray-500">Brief, kind responses with helpful links & GIFs.</p>
      </div>

      <div className="flex flex-col w-full max-w-3xl mx-auto flex-grow">
        {renderedMessages.map((parts, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className={`mb-4 ${messages[idx + 1]?.role === "user" ? "text-right" : "text-left"}`}>
            <div className={`inline-block max-w-[80%] px-4 py-3 rounded-2xl shadow whitespace-pre-wrap ${
              messages[idx + 1]?.role === "user"
                ? "bg-blue-100 text-blue-900"
                : "bg-green-100 text-green-900"
            }`}>
              {parts.map((part, i) => (
                <div key={i}>{part}</div>
              ))}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <motion.div className="mb-4 text-left" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="inline-block px-4 py-3 bg-green-100 text-green-900 rounded-2xl shadow">
              <span className="typing-dots">AURORA⁺ is typing</span>
            </div>
          </motion.div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="w-full max-w-3xl mx-auto mt-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            placeholder="How are you feeling?"
            className="flex-1 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={onSubmit}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      <style jsx>{`
        .typing-dots::after {
          content: '...';
          animation: blink 1s steps(1, end) infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 0 }
          50% { opacity: 1 }
        }
      `}</style>
    </div>
  )
}
