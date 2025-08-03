import { type NextRequest, NextResponse } from "next/server"

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "demo_key"
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!lat || !lon) {
    return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
  }

  // Check if we have a valid API key
  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "demo_key") {
    console.error("OpenWeather API key not configured")
    return NextResponse.json(
      {
        error: "Weather service not configured. Please add OPENWEATHER_API_KEY to environment variables.",
      },
      { status: 500 },
    )
  }

  try {
    console.log(`Fetching weather for coordinates: ${lat}, ${lon}`)

    // Fetch current weather with better error handling and retry logic
    let currentWeatherResponse
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        currentWeatherResponse = await fetch(
          `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`,
          {
            headers: {
              "User-Agent": "WeatherApp/1.0",
            },
            timeout: 10000,
          },
        )

        if (currentWeatherResponse.ok) {
          break
        }

        if (currentWeatherResponse.status === 404) {
          // Try with slightly adjusted coordinates for better coverage
          const adjustedLat = Number.parseFloat(lat) + (Math.random() - 0.5) * 0.1
          const adjustedLon = Number.parseFloat(lon) + (Math.random() - 0.5) * 0.1

          currentWeatherResponse = await fetch(
            `${OPENWEATHER_BASE_URL}/weather?lat=${adjustedLat}&lon=${adjustedLon}&appid=${OPENWEATHER_API_KEY}&units=metric`,
            {
              headers: {
                "User-Agent": "WeatherApp/1.0",
              },
            },
          )

          if (currentWeatherResponse.ok) {
            console.log("Weather found with adjusted coordinates")
            break
          }
        }

        retryCount++
        if (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
        }
      } catch (fetchError) {
        console.error(`Fetch attempt ${retryCount + 1} failed:`, fetchError)
        retryCount++
        if (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
        }
      }
    }

    if (!currentWeatherResponse || !currentWeatherResponse.ok) {
      const errorText = currentWeatherResponse ? await currentWeatherResponse.text() : "Network error"
      console.error("OpenWeather API error:", currentWeatherResponse?.status, errorText)

      if (currentWeatherResponse?.status === 401) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
      }
      if (currentWeatherResponse?.status === 404) {
        return NextResponse.json({ error: "Weather data not available for this location" }, { status: 404 })
      }

      throw new Error(`Weather API returned ${currentWeatherResponse?.status || "network error"}`)
    }

    const currentWeather = await currentWeatherResponse.json()
    console.log("Current weather fetched successfully for:", currentWeather.name)

    // Fetch forecast data with error handling
    const forecastResponse = await fetch(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`,
      {
        headers: {
          "User-Agent": "WeatherApp/1.0",
        },
      },
    )

    if (!forecastResponse.ok) {
      console.error("Forecast API error:", forecastResponse.status)
      // Continue without forecast data
    }

    const forecast = forecastResponse.ok ? await forecastResponse.json() : null

    // Fetch UV Index with error handling
    const uvResponse = await fetch(`${OPENWEATHER_BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`, {
      headers: {
        "User-Agent": "WeatherApp/1.0",
      },
    })

    let uvIndex = 0
    if (uvResponse.ok) {
      const uvData = await uvResponse.json()
      uvIndex = uvData.value || 0
    }

    // Process hourly forecast with 1-hour intervals (simulate hourly data from 3-hour intervals)
    const hourlyForecast = []
    if (forecast && forecast.list) {
      const now = new Date()
      const currentHour = now.getHours()

      // Create 24 hourly entries by interpolating between 3-hour intervals
      for (let i = 0; i < 24; i++) {
        const targetTime = new Date(now)
        targetTime.setHours(currentHour + i + 1, 0, 0, 0)

        // Find the closest forecast data points
        const forecastIndex = Math.floor(i / 3)
        const forecastData = forecast.list[forecastIndex] || forecast.list[forecast.list.length - 1]

        if (forecastData) {
          const isNextDay = targetTime.getDate() !== now.getDate()

          // For temperature interpolation between data points
          let temperature = forecastData.main.temp
          if (forecastIndex < forecast.list.length - 1) {
            const nextForecast = forecast.list[forecastIndex + 1]
            const progress = (i % 3) / 3
            temperature = forecastData.main.temp + (nextForecast.main.temp - forecastData.main.temp) * progress
          }

          hourlyForecast.push({
            time:
              targetTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }) + (isNextDay ? " +1" : ""),
            temp: Math.round(temperature),
            condition: forecastData.weather[0].main,
            icon: forecastData.weather[0].icon,
          })
        }
      }
    }

    // If no forecast data, create fallback hourly data based on current weather
    if (hourlyForecast.length === 0) {
      const now = new Date()
      const currentHour = now.getHours()

      for (let i = 0; i < 24; i++) {
        const targetTime = new Date(now)
        targetTime.setHours(currentHour + i + 1, 0, 0, 0)
        const isNextDay = targetTime.getDate() !== now.getDate()

        // Simulate slight temperature variations
        const tempVariation = Math.sin((i * Math.PI) / 12) * 3 // ±3°C variation
        const temp = currentWeather.main.temp + tempVariation

        hourlyForecast.push({
          time:
            targetTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }) + (isNextDay ? " +1" : ""),
          temp: Math.round(temp),
          condition: currentWeather.weather[0].main,
          icon: currentWeather.weather[0].icon,
        })
      }
    }

    // Process weekly forecast - with fallback
    let weeklyForecast = []
    if (forecast && forecast.list) {
      const dailyForecasts = new Map()
      forecast.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toDateString()
        if (!dailyForecasts.has(date)) {
          dailyForecasts.set(date, {
            day: new Date(item.dt * 1000).toLocaleDateString([], { weekday: "long" }),
            high: item.main.temp_max,
            low: item.main.temp_min,
            condition: item.weather[0].main,
            icon: item.weather[0].icon,
            precipitation: Math.round((item.pop || 0) * 100),
          })
        } else {
          const existing = dailyForecasts.get(date)
          existing.high = Math.max(existing.high, item.main.temp_max)
          existing.low = Math.min(existing.low, item.main.temp_min)
        }
      })
      weeklyForecast = Array.from(dailyForecasts.values()).slice(0, 7)
    }

    // Format sunrise and sunset times in 24-hour format
    const sunrise = new Date(currentWeather.sys.sunrise * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })

    const sunset = new Date(currentWeather.sys.sunset * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })

    const weatherData = {
      location: `${currentWeather.name}, ${currentWeather.sys.country}`,
      temperature: currentWeather.main.temp,
      condition: currentWeather.weather[0].main,
      description: currentWeather.weather[0].description,
      humidity: currentWeather.main.humidity,
      windSpeed: currentWeather.wind?.speed || 0,
      windDirection: currentWeather.wind?.deg || 0,
      visibility: currentWeather.visibility || 10000,
      pressure: currentWeather.main.pressure,
      uvIndex: Math.round(uvIndex),
      sunrise,
      sunset,
      feelsLike: currentWeather.main.feels_like,
      hourlyForecast,
      weeklyForecast,
    }

    console.log("Weather data processed successfully")
    return NextResponse.json(weatherData)
  } catch (error) {
    console.error("Weather API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch weather data. Please check your internet connection and try again.",
      },
      { status: 500 },
    )
  }
}
