// lib/spotify.ts
const SPOTIFY_CLIENT_ID = "9ecfdc17e1e84f5a995308454c4ac29a"
const SPOTIFY_CLIENT_SECRET = "303180beb0ed4a20a17c5135a85ee419"

export async function getSpotifyToken(): Promise<string | null> {
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

export async function getTopSpotifyTrack(query: string): Promise<string | null> {
  const token = await getSpotifyToken()
  if (!token) return null

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    const data = await res.json()
    const items = data?.tracks?.items || []

    if (items.length === 0) return null

    // Try exact match first
    const exact = items.find((track: { name: string }) =>
      track.name.toLowerCase() === query.toLowerCase()
    )

    return (exact || items[0])?.id || null
  } catch (e) {
    console.error("Spotify search error:", e)
    return null
  }
}
