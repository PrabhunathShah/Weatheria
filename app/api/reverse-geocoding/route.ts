import { type NextRequest, NextResponse } from "next/server"

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "demo_key"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!lat || !lon) {
    return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
  }

  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "demo_key") {
    return NextResponse.json({ error: "Weather service not configured" }, { status: 500 })
  }

  try {
    // Use OpenWeather's reverse geocoding API
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=5&appid=${OPENWEATHER_API_KEY}`,
    )

    if (!response.ok) {
      throw new Error("Failed to fetch location data")
    }

    const locations = await response.json()

    if (locations.length === 0) {
      return NextResponse.json({ error: "No location found for these coordinates" }, { status: 404 })
    }

    // Return all found locations, prioritizing by importance
    const sortedLocations = locations.sort((a: any, b: any) => {
      // Prioritize locations with state information
      if (a.state && !b.state) return -1
      if (!a.state && b.state) return 1

      // Prioritize by name length (shorter names are usually more important cities)
      return a.name.length - b.name.length
    })

    return NextResponse.json(sortedLocations)
  } catch (error) {
    console.error("Reverse geocoding error:", error)
    return NextResponse.json({ error: "Failed to get location information" }, { status: 500 })
  }
}
