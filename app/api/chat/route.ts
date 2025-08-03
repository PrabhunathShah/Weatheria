import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  try {
    const { message, weatherData } = await request.json()

    console.log("Chat API called with message:", message)
    console.log("Weather data available:", !!weatherData)

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Check if we have the Gemini API key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    console.log("API Key available:", !!apiKey)

    if (!apiKey) {
      console.error("Google Gemini API key not configured")
      return NextResponse.json({
        response:
          "I'm sorry, but I need to be configured with an API key to work properly. Please ask the administrator to add the GOOGLE_GENERATIVE_AI_API_KEY environment variable.",
      })
    }

    // Create context from weather data
    let weatherContext = ""
    if (weatherData) {
      weatherContext = `
Current weather information for ${weatherData.location}:
- Temperature: ${Math.round(weatherData.temperature)}°C (feels like ${Math.round(weatherData.feelsLike)}°C)
- Condition: ${weatherData.condition} - ${weatherData.description}
- Humidity: ${weatherData.humidity}%
- Wind: ${Math.round(weatherData.windSpeed)} m/s
- Pressure: ${weatherData.pressure} hPa
- UV Index: ${weatherData.uvIndex}
- Sunrise: ${weatherData.sunrise}
- Sunset: ${weatherData.sunset}

Today's forecast (next 12 hours):
${weatherData.hourlyForecast
  ?.slice(0, 12)
  .map((hour: any) => `${hour.time}: ${Math.round(hour.temp)}°C, ${hour.condition}`)
  .join("\n")}

Weekly forecast:
${weatherData.weeklyForecast
  ?.slice(0, 5)
  .map((day: any) => `${day.day}: High ${Math.round(day.high)}°C, Low ${Math.round(day.low)}°C, ${day.condition}`)
  .join("\n")}
      `
    } else {
      weatherContext = "No current weather data is available at the moment."
    }

    const systemPrompt = `You are WeatherBot, a helpful and friendly AI weather assistant. 

${weatherContext}

Your role is to:
- Provide helpful, accurate, and conversational responses about weather conditions and forecasts
- Give weather-related advice and recommendations based on the current data
- Be friendly, informative, and use appropriate emojis when suitable
- Keep responses concise but informative (2-4 sentences typically)
- Use the weather data provided to give specific, relevant answers
- Always be encouraging and helpful

Guidelines:
- Use the actual weather data in your responses when available
- Provide practical advice based on current conditions
- Be conversational and engaging
- Include relevant emojis to make responses more friendly
- If no weather data is available, acknowledge this and offer general weather advice`

    console.log("Attempting to generate text with Gemini...")

    try {
      // Try with gemini-1.5-flash first
      const { text } = await generateText({
        model: google("gemini-1.5-flash"),
        system: systemPrompt,
        prompt: message,
        maxTokens: 300,
        temperature: 0.7,
      })

      console.log("Successfully generated response:", text.substring(0, 100) + "...")
      return NextResponse.json({ response: text })
    } catch (aiError: any) {
      console.error("Gemini 1.5 Flash failed, trying Pro:", aiError.message)

      try {
        // Fallback to gemini-1.5-pro
        const { text } = await generateText({
          model: google("gemini-1.5-pro"),
          system: systemPrompt,
          prompt: message,
          maxTokens: 300,
          temperature: 0.7,
        })

        console.log("Successfully generated response with Pro:", text.substring(0, 100) + "...")
        return NextResponse.json({ response: text })
      } catch (proError: any) {
        console.error("Gemini Pro also failed:", proError.message)

        // Try without system prompt as final fallback
        try {
          const combinedPrompt = `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`

          const { text } = await generateText({
            model: google("gemini-1.5-flash"),
            prompt: combinedPrompt,
            maxTokens: 300,
            temperature: 0.7,
          })

          console.log("Successfully generated response without system prompt")
          return NextResponse.json({ response: text })
        } catch (finalError: any) {
          console.error("All AI attempts failed:", finalError.message)

          // Handle specific AI API errors
          if (finalError.message?.includes("API key") || finalError.message?.includes("authentication")) {
            return NextResponse.json({
              response:
                "I'm having trouble with my API authentication. Please check that the Google AI API key is properly configured. 🔧",
            })
          }

          if (finalError.message?.includes("quota") || finalError.message?.includes("limit")) {
            return NextResponse.json({
              response: "I've reached my usage limit for now. Please try again later! ⏰",
            })
          }

          if (finalError.message?.includes("model")) {
            return NextResponse.json({
              response: "I'm having trouble accessing my AI model. Please try again in a moment! 🤖",
            })
          }

          // Provide a basic weather response if AI fails but we have weather data
          if (weatherData) {
            let basicResponse = `Based on the current weather data I have:\n\n`
            basicResponse += `🌡️ It's ${Math.round(weatherData.temperature)}°C in ${weatherData.location} with ${weatherData.description}.\n`
            basicResponse += `💨 Wind speed is ${Math.round(weatherData.windSpeed)} m/s\n`
            basicResponse += `💧 Humidity is at ${weatherData.humidity}%\n\n`
            basicResponse += `I'm experiencing some technical issues with my AI processing, but I hope this basic weather info helps! Please try asking again in a moment.`

            return NextResponse.json({ response: basicResponse })
          }

          return NextResponse.json({
            response: "I'm experiencing some technical difficulties right now. Please try again in a moment! ⚡",
          })
        }
      }
    }
  } catch (error: any) {
    console.error("Chat API error:", error)
    return NextResponse.json({
      response: "I'm having trouble processing your request right now. Please try again! 🔄",
    })
  }
}
