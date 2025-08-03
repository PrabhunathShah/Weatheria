import { type NextRequest, NextResponse } from "next/server"

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "demo_key"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "demo_key") {
    return NextResponse.json({ error: "Weather service not configured" }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${OPENWEATHER_API_KEY}`,
    )

    if (!response.ok) {
      throw new Error("Failed to fetch location data")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Geocoding API error:", error)
    return NextResponse.json({ error: "Failed to search locations" }, { status: 500 })
  }
}
