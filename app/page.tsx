"use client";

import { useState, useEffect } from "react";
import { WeatherDisplay } from "@/components/weather-display";
import { ChatBot } from "@/components/chat-bot";
import { LocationSearch } from "@/components/location-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { MessageCircle, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  pressure: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  feelsLike: number;
  hourlyForecast: Array<{
    time: string;
    temp: number;
    condition: string;
    icon: string;
  }>;
  weeklyForecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
    precipitation: number;
  }>;
}

interface LocationInfo {
  lat: number;
  lon: number;
  name?: string;
  displayName?: string;
}

export default function Home() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>("");

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeatherData();
    }
  }, [location]);

  const getCurrentLocation = async () => {
    setLocationStatus("Getting your location...");

    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this browser");
      await tryFallbackLocation("Kolkata", 22.5726, 88.3639);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("GPS coordinates obtained:", latitude, longitude);
        await findNearestCityWithWeatherData(latitude, longitude);
      },
      async (error) => {
        console.log("Geolocation error:", error.message);
        setLocationStatus("Location access denied, using Kolkata...");
        await tryFallbackLocation("Kolkata", 22.5726, 88.3639);
      },
      options
    );
  };

  const findNearestCityWithWeatherData = async (lat: number, lon: number) => {
    setLocationStatus("Finding your nearest city with weather data...");

    try {
      // Step 1: Try reverse geocoding to get location names
      console.log("Trying reverse geocoding...");
      const reverseGeoResponse = await fetch(
        `/api/reverse-geocoding?lat=${lat}&lon=${lon}`
      );

      if (reverseGeoResponse.ok) {
        const locations = await reverseGeoResponse.json();
        console.log("Reverse geocoding results:", locations);

        // Step 2: Try each location from reverse geocoding
        for (const loc of locations) {
          const locationName = loc.state
            ? `${loc.name}, ${loc.state}, ${loc.country}`
            : `${loc.name}, ${loc.country}`;

          setLocationStatus(`Checking weather for ${loc.name}...`);
          console.log(`Trying weather for: ${locationName}`);

          const weatherTest = await fetch(
            `/api/weather?lat=${loc.lat}&lon=${loc.lon}`
          );
          if (weatherTest.ok) {
            console.log(`Weather data found for: ${locationName}`);
            setLocation({
              lat: loc.lat,
              lon: loc.lon,
              name: loc.name,
              displayName: locationName,
            });
            setLocationStatus("");
            return;
          }
        }
      }

      // Step 3: Try finding nearby cities using city search
      setLocationStatus("Searching for nearby cities...");
      await findNearbyCitiesWithWeatherData(lat, lon);
    } catch (error) {
      console.error("Error in findNearestCityWithWeatherData:", error);
      await tryNearbyMajorCities(lat, lon);
    }
  };

  const findNearbyCitiesWithWeatherData = async (lat: number, lon: number) => {
    try {
      // Create search queries for nearby areas with different radiuses
      const searchRadiuses = [0.1, 0.2, 0.5, 1.0, 2.0]; // degrees (roughly 11km, 22km, 55km, 111km, 222km)

      for (const radius of searchRadiuses) {
        setLocationStatus(
          `Searching within ${Math.round(radius * 111)}km radius...`
        );

        // Try multiple points around the user's location
        const searchPoints = [
          { lat: lat, lon: lon }, // exact location
          { lat: lat + radius, lon: lon }, // north
          { lat: lat - radius, lon: lon }, // south
          { lat: lat, lon: lon + radius }, // east
          { lat: lat, lon: lon - radius }, // west
          { lat: lat + radius / 2, lon: lon + radius / 2 }, // northeast
          { lat: lat - radius / 2, lon: lon - radius / 2 }, // southwest
        ];

        for (const point of searchPoints) {
          try {
            // Try to get weather data for this point
            const weatherResponse = await fetch(
              `/api/weather?lat=${point.lat}&lon=${point.lon}`
            );

            if (weatherResponse.ok) {
              const weatherData = await weatherResponse.json();
              console.log(
                `Found weather data at: ${point.lat}, ${point.lon} for ${weatherData.location}`
              );

              setLocation({
                lat: point.lat,
                lon: point.lon,
                name: weatherData.location.split(",")[0],
                displayName: `${weatherData.location} (nearest city)`,
              });
              setLocationStatus("");
              return;
            }
          } catch (error) {
            console.log(
              `No weather data for point: ${point.lat}, ${point.lon}`
            );
            continue;
          }
        }
      }

      // If no nearby points work, try major cities
      await tryNearbyMajorCities(lat, lon);
    } catch (error) {
      console.error("Error in findNearbyCitiesWithWeatherData:", error);
      await tryNearbyMajorCities(lat, lon);
    }
  };

  const tryNearbyMajorCities = async (lat: number, lon: number) => {
    setLocationStatus("Finding nearest major city...");

    // Comprehensive list of major cities worldwide, prioritizing Indian cities
    const majorCities = [
      // Indian cities
      { name: "Mumbai", lat: 19.076, lon: 72.8777, country: "IN" },
      { name: "Delhi", lat: 28.6139, lon: 77.209, country: "IN" },
      { name: "Kolkata", lat: 22.5726, lon: 88.3639, country: "IN" },
      { name: "Bangalore", lat: 12.9716, lon: 77.5946, country: "IN" },
      { name: "Chennai", lat: 13.0827, lon: 80.2707, country: "IN" },
      { name: "Hyderabad", lat: 17.385, lon: 78.4867, country: "IN" },
      { name: "Pune", lat: 18.5204, lon: 73.8567, country: "IN" },
      { name: "Ahmedabad", lat: 23.0225, lon: 72.5714, country: "IN" },
      { name: "Jaipur", lat: 26.9124, lon: 75.7873, country: "IN" },
      { name: "Lucknow", lat: 26.8467, lon: 80.9462, country: "IN" },
      { name: "Kanpur", lat: 26.4499, lon: 80.3319, country: "IN" },
      { name: "Nagpur", lat: 21.1458, lon: 79.0882, country: "IN" },
      { name: "Indore", lat: 22.7196, lon: 75.8577, country: "IN" },
      { name: "Thane", lat: 19.2183, lon: 72.9781, country: "IN" },
      { name: "Bhopal", lat: 23.2599, lon: 77.4126, country: "IN" },
      { name: "Visakhapatnam", lat: 17.6868, lon: 83.2185, country: "IN" },
      { name: "Patna", lat: 25.5941, lon: 85.1376, country: "IN" },
      { name: "Vadodara", lat: 22.3072, lon: 73.1812, country: "IN" },
      { name: "Ghaziabad", lat: 28.6692, lon: 77.4538, country: "IN" },
      { name: "Ludhiana", lat: 30.901, lon: 75.8573, country: "IN" },

      // International cities
      { name: "New York", lat: 40.7128, lon: -74.006, country: "US" },
      { name: "London", lat: 51.5074, lon: -0.1278, country: "GB" },
      { name: "Tokyo", lat: 35.6762, lon: 139.6503, country: "JP" },
      { name: "Paris", lat: 48.8566, lon: 2.3522, country: "FR" },
      { name: "Sydney", lat: -33.8688, lon: 151.2093, country: "AU" },
      { name: "Singapore", lat: 1.3521, lon: 103.8198, country: "SG" },
      { name: "Dubai", lat: 25.2048, lon: 55.2708, country: "AE" },
      { name: "Bangkok", lat: 13.7563, lon: 100.5018, country: "TH" },
    ];

    // Calculate distance and find nearest cities
    const distances = majorCities.map((city) => ({
      ...city,
      distance: Math.sqrt(
        Math.pow(lat - city.lat, 2) + Math.pow(lon - city.lon, 2)
      ),
    }));

    distances.sort((a, b) => a.distance - b.distance);

    // Try the nearest cities (try top 5)
    for (const city of distances.slice(0, 5)) {
      try {
        setLocationStatus(`Trying ${city.name}...`);
        console.log(
          `Trying major city: ${city.name} (${city.distance.toFixed(
            2
          )} degrees away)`
        );

        const weatherTest = await fetch(
          `/api/weather?lat=${city.lat}&lon=${city.lon}`
        );

        if (weatherTest.ok) {
          console.log(`Weather data found for major city: ${city.name}`);
          setLocation({
            lat: city.lat,
            lon: city.lon,
            name: city.name,
            displayName: `${city.name} (nearest major city)`,
          });
          setLocationStatus("");
          return;
        }
      } catch (error) {
        console.error(`Failed to get weather for ${city.name}:`, error);
      }
    }

    // Final fallback to Kolkata
    await tryFallbackLocation("Kolkata", 22.5726, 88.3639);
  };

  const tryFallbackLocation = async (
    cityName: string,
    lat: number,
    lon: number
  ) => {
    setLocationStatus(`Using ${cityName} as fallback...`);

    try {
      const weatherTest = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);

      if (weatherTest.ok) {
        setLocation({
          lat,
          lon,
          name: cityName,
          displayName: `${cityName} (default location)`,
        });
      } else {
        throw new Error("Even fallback location failed");
      }
    } catch (error) {
      setError(
        "Unable to fetch weather data. Please try searching for a city manually."
      );
    } finally {
      setLocationStatus("");
    }
  };

  const fetchWeatherData = async () => {
    if (!location) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/weather?lat=${location.lat}&lon=${location.lon}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch weather data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (lat: number, lon: number, name: string) => {
    setLocation({ lat, lon, name, displayName: name });
  };

  const handleRefresh = () => {
    if (location) {
      fetchWeatherData();
    }
  };

  const handleRetryLocation = () => {
    setError(null);
    setLocation(null);
    setWeatherData(null);
    getCurrentLocation();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 bg-clip-text text-transparent">
              Weatheria
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
              Stay informed about the weather conditions
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none">
              <LocationSearch onLocationSelect={handleLocationSelect} />
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Location Status */}
        {locationStatus && (
          <Card className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-500 animate-pulse" />
                <p className="text-blue-700 dark:text-blue-300 font-medium text-sm">
                  {locationStatus}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Location Error with Retry */}
        {error && (
          <Card className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-700 dark:text-red-300 font-medium mb-2 text-sm">
                    {error}
                  </p>
                  <Button
                    onClick={handleRetryLocation}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <WeatherDisplay
          weatherData={weatherData}
          loading={loading}
          error={error}
          onRefresh={handleRefresh}
          currentLocation={location?.displayName}
        />

        {/* Floating Chat Button - Forest Green */}
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 bg-gradient-to-br from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 border-0 z-40"
          size="icon"
        >
          <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
        </Button>

        <ChatBot
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          weatherData={weatherData}
        />
      </div>
    </div>
  );
}
