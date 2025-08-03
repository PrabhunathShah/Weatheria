"use client";

import {
  RefreshCw,
  MapPin,
  Eye,
  Wind,
  Droplets,
  Gauge,
  Sun,
  Thermometer,
  Cloud,
  CloudRain,
  Zap,
  Snowflake,
  CloudDrizzle,
  Activity,
  Compass,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getWeatherBackgroundImage } from "@/lib/weather-images";

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
  airQuality?: {
    aqi: number;
    status: string;
    description: string;
  }; // Add air quality
  hourlyForecast: Array<{
    time: string;
    temp: number;
    condition: string;
    icon: string;
    timestamp: number; // Add timestamp for proper timezone conversion
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

interface WeatherDisplayProps {
  weatherData: WeatherData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  currentLocation?: string;
}

const getWeatherIcon = (condition: string, size: "sm" | "md" | "lg" = "md") => {
  const conditionLower = condition.toLowerCase();
  const sizeClass =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-6 w-6";

  if (conditionLower.includes("clear") || conditionLower.includes("sunny"))
    return <Sun className={`${sizeClass} text-yellow-500`} />;
  if (conditionLower.includes("cloud") && !conditionLower.includes("rain"))
    return <Cloud className={`${sizeClass} text-gray-500`} />;
  if (conditionLower.includes("rain") && !conditionLower.includes("drizzle"))
    return <CloudRain className={`${sizeClass} text-blue-500`} />;
  if (conditionLower.includes("storm") || conditionLower.includes("thunder"))
    return <Zap className={`${sizeClass} text-purple-500`} />;
  if (conditionLower.includes("snow"))
    return <Snowflake className={`${sizeClass} text-blue-300`} />;
  if (conditionLower.includes("drizzle"))
    return <CloudDrizzle className={`${sizeClass} text-blue-400`} />;
  return <Cloud className={`${sizeClass} text-gray-400`} />;
};

const getWeatherIconLarge = (condition: string) => {
  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes("clear") || conditionLower.includes("sunny"))
    return <Sun className="h-16 w-16 text-yellow-400" />;
  if (conditionLower.includes("cloud") && !conditionLower.includes("rain"))
    return <Cloud className="h-16 w-16 text-gray-300" />;
  if (conditionLower.includes("rain") && !conditionLower.includes("drizzle"))
    return <CloudRain className="h-16 w-16 text-blue-400" />;
  if (conditionLower.includes("storm") || conditionLower.includes("thunder"))
    return <Zap className="h-16 w-16 text-purple-400" />;
  if (conditionLower.includes("snow"))
    return <Snowflake className="h-16 w-16 text-blue-200" />;
  if (conditionLower.includes("drizzle"))
    return <CloudDrizzle className="h-16 w-16 text-blue-300" />;
  return <Cloud className="h-16 w-16 text-gray-300" />;
};

const getWindDirection = (degrees: number) => {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

const getComfortLevel = (temp: number, humidity: number) => {
  if (temp >= 20 && temp <= 26 && humidity >= 40 && humidity <= 60)
    return "Perfect";
  if (temp >= 18 && temp <= 28 && humidity >= 30 && humidity <= 70)
    return "Comfortable";
  if (temp >= 15 && temp <= 30) return "Moderate";
  return "Uncomfortable";
};

const generateLocationTimes = (location: string, hourlyData: any[]) => {
  // Comprehensive timezone offset mapping for major cities/regions
  const timezoneOffsets: { [key: string]: number } = {
    // Asia
    tokyo: 9,
    japan: 9,
    "tokyo, jp": 9,
    beijing: 8,
    china: 8,
    shanghai: 8,
    "beijing, cn": 8,
    mumbai: 5.5,
    india: 5.5,
    delhi: 5.5,
    "mumbai, in": 5.5,
    singapore: 8,
    "singapore, sg": 8,
    "hong kong": 8,
    hongkong: 8,
    "hong kong, hk": 8,
    seoul: 9,
    "south korea": 9,
    "seoul, kr": 9,
    bangkok: 7,
    thailand: 7,
    "bangkok, th": 7,
    jakarta: 7,
    indonesia: 7,
    "jakarta, id": 7,

    // Europe
    london: 0,
    uk: 0,
    "united kingdom": 0,
    "london, gb": 0,
    paris: 1,
    france: 1,
    "paris, fr": 1,
    berlin: 1,
    germany: 1,
    "berlin, de": 1,
    rome: 1,
    italy: 1,
    "rome, it": 1,
    madrid: 1,
    spain: 1,
    "madrid, es": 1,
    amsterdam: 1,
    netherlands: 1,
    "amsterdam, nl": 1,
    moscow: 3,
    russia: 3,
    "moscow, ru": 3,
    stockholm: 1,
    sweden: 1,
    "stockholm, se": 1,

    // North America
    "new york": -5,
    nyc: -5,
    "new york, us": -5,
    "new york, ny, us": -5,
    "los angeles": -8,
    california: -8,
    "los angeles, us": -8,
    "los angeles, ca, us": -8,
    chicago: -6,
    "chicago, us": -6,
    "chicago, il, us": -6,
    toronto: -5,
    canada: -5,
    "toronto, ca": -5,
    vancouver: -8,
    "vancouver, ca": -8,
    miami: -5,
    "miami, us": -5,
    "miami, fl, us": -5,

    // Australia & Oceania
    sydney: 11,
    australia: 11,
    "sydney, au": 11,
    melbourne: 11,
    "melbourne, au": 11,
    perth: 8,
    "perth, au": 8,
    auckland: 13,
    "new zealand": 13,
    "auckland, nz": 13,

    // Middle East & Africa
    dubai: 4,
    uae: 4,
    "dubai, ae": 4,
    cairo: 2,
    egypt: 2,
    "cairo, eg": 2,
    "south africa": 2,
    johannesburg: 2,
    "johannesburg, za": 2,
    istanbul: 3,
    turkey: 3,
    "istanbul, tr": 3,

    // South America
    "sao paulo": -3,
    brazil: -3,
    "sao paulo, br": -3,
    "buenos aires": -3,
    argentina: -3,
    "buenos aires, ar": -3,
    lima: -5,
    peru: -5,
    "lima, pe": -5,
  };

  // Get timezone offset for location
  const locationLower = location.toLowerCase();
  let offset = 0; // Default to UTC

  // Find the best match for the location
  for (const [key, value] of Object.entries(timezoneOffsets)) {
    if (locationLower.includes(key)) {
      offset = value;
      break;
    }
  }

  // Get current UTC time
  const now = new Date();
  const utcHour = now.getUTCHours();

  // Calculate the starting hour in the target timezone
  const localHour = (utcHour + offset + 24) % 24;

  return hourlyData.map((hour, index) => {
    const targetHour = (localHour + index) % 24;
    const isNextDay = localHour + index >= 24;

    return {
      ...hour,
      displayTime: `${targetHour.toString().padStart(2, "0")}:00${
        isNextDay ? " +1" : ""
      }`,
    };
  });
};

export function WeatherDisplay({
  weatherData,
  loading,
  error,
  onRefresh,
  currentLocation,
}: WeatherDisplayProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg rounded-2xl">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-16 w-32" />
              <Skeleton className="h-6 w-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg rounded-2xl">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <Cloud className="h-16 w-16 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                Unable to load weather data
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            </div>
            <Button
              onClick={onRefresh}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weatherData) return null;

  // Always use real images now
  const backgroundImageUrl = getWeatherBackgroundImage(weatherData.condition);

  return (
    <div className="space-y-6">
      {/* Desktop Layout - Main card takes more space, 7-day forecast is narrow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Weather Card - Takes 8 columns with Background Image */}
        <div className="lg:col-span-8">
          <Card className="shadow-2xl rounded-3xl overflow-hidden relative h-full">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('${backgroundImageUrl}')`,
              }}
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/40"></div>

            <CardContent className="p-6 relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-white drop-shadow-lg" />
                  <div>
                    <span className="text-lg font-semibold text-white drop-shadow-lg block">
                      {currentLocation || weatherData.location}
                    </span>
                    <p className="text-white/80 text-sm drop-shadow-lg">
                      Current Location
                    </p>
                  </div>
                </div>
                <Button
                  onClick={onRefresh}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0 drop-shadow-lg"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center space-x-6 mb-4">
                  <span className="text-6xl lg:text-7xl font-light text-white drop-shadow-2xl">
                    {Math.round(weatherData.temperature)}°C
                  </span>
                  <div className="drop-shadow-lg">
                    {getWeatherIconLarge(weatherData.condition)}
                  </div>
                </div>
                <p className="text-xl text-white capitalize mb-2 drop-shadow-lg">
                  {weatherData.description}
                </p>
                <p className="text-white/90 flex items-center text-sm drop-shadow-lg">
                  <Thermometer className="h-4 w-4 mr-1" />
                  Feels like {Math.round(weatherData.feelsLike)}°
                </p>
              </div>

              {/* Glass Effect Metrics Row with Different Colors */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 sm:p-4 text-center shadow-lg hover:bg-white/15 transition-all duration-300">
                  <Gauge className="h-4 w-4 mx-auto mb-1 sm:mb-2 text-white drop-shadow-lg" />
                  <p className="text-xs font-medium mb-1 text-white/90 drop-shadow-lg">
                    Pressure
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-white drop-shadow-lg">
                    {weatherData.pressure}mb
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 sm:p-4 text-center shadow-lg hover:bg-white/15 transition-all duration-300">
                  <Eye className="h-4 w-4 mx-auto mb-1 sm:mb-2 text-white drop-shadow-lg" />
                  <p className="text-xs font-medium mb-1 text-white/90 drop-shadow-lg">
                    Visibility
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-white drop-shadow-lg">
                    {(weatherData.visibility / 1000).toFixed(1)} km
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 sm:p-4 text-center shadow-lg hover:bg-white/15 transition-all duration-300">
                  <Droplets className="h-4 w-4 mx-auto mb-1 sm:mb-2 text-white drop-shadow-lg" />
                  <p className="text-xs font-medium mb-1 text-white/90 drop-shadow-lg">
                    Humidity
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-white drop-shadow-lg">
                    {weatherData.humidity}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 7-Day Forecast - Glass Effect with Gray Tint */}
        <div className="lg:col-span-4">
          <Card className="bg-gray-500/20 dark:bg-slate-600/30 backdrop-blur-md border border-gray-300/20 dark:border-slate-500/30 shadow-xl rounded-3xl h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
                7-Day Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {weatherData.weeklyForecast.map((day, index) => (
                  <div
                    key={index}
                    className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 shadow-md rounded-xl hover:shadow-lg hover:bg-white/50 dark:hover:bg-slate-600/50 transition-all duration-300 flex items-center justify-between py-3 px-3"
                  >
                    {/* Left side - Day and Weather Info */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {getWeatherIcon(day.condition, "sm")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                          {day.day}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 capitalize truncate">
                          {day.condition}
                        </p>
                      </div>
                    </div>

                    {/* Right side - Precipitation and Temperature */}
                    <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                      {/* Temperature */}
                      <div className="flex items-center space-x-1">
                        <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                          {Math.round(day.high)}°
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                          {Math.round(day.low)}°
                        </span>
                      </div>
                      {/* Precipitation */}
                      <div className="flex items-center space-x-1">
                        <Droplets className="h-3 w-3 text-blue-500" />
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {day.precipitation}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 24-Hour Forecast - Glass Effect with Blue Tint */}
      <Card className="bg-blue-500/20 dark:bg-blue-600/30 backdrop-blur-md border border-blue-300/20 dark:border-blue-500/30 shadow-xl rounded-3xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-blue-800 dark:text-blue-100">
            24-Hour Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex space-x-6 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {generateLocationTimes(
              weatherData.location,
              weatherData.hourlyForecast
            ).map((hour, index) => (
              <div
                key={index}
                className="flex-shrink-0 text-center space-y-3 min-w-[100px] p-4 bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 shadow-md rounded-2xl hover:shadow-lg hover:bg-white/50 dark:hover:bg-slate-600/50 transition-all duration-300"
              >
                <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
                  {hour.displayTime}
                </p>
                <div className="flex justify-center">
                  {getWeatherIcon(hour.condition, "sm")}
                </div>
                <p className="text-lg font-bold text-blue-800 dark:text-blue-100">
                  {Math.round(hour.temp)}°
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Metric Cards - Glass Effect with Color Themes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Wind - Glass with Emerald Theme */}
        <Card className="bg-emerald-500/30 backdrop-blur-md border border-emerald-300/30 shadow-xl rounded-3xl text-gray-900 dark:text-white hover:shadow-2xl hover:bg-emerald-500/40 transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Wind className="h-8 w-8 text-emerald-800 dark:text-emerald-200" />
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {Math.round(weatherData.windSpeed)} m/s
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Wind Speed
                </p>
              </div>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Direction: {getWindDirection(weatherData.windDirection)} (
              {weatherData.windDirection}°)
            </p>
          </CardContent>
        </Card>

        {/* UV Index - Glass with Orange Theme */}
        <Card className="bg-orange-500/30 backdrop-blur-md border border-orange-300/30 shadow-xl rounded-3xl text-gray-900 dark:text-white hover:shadow-2xl hover:bg-orange-500/40 transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Sun className="h-8 w-8 text-orange-800 dark:text-orange-200" />
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {weatherData.uvIndex} UVI
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  UV Index
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Temperature Trends - Glass with Purple Theme */}
        <Card className="bg-purple-500/30 backdrop-blur-md border border-purple-300/30 shadow-xl rounded-3xl text-gray-900 dark:text-white hover:shadow-2xl hover:bg-purple-500/40 transition-all duration-300 hover:-translate-y-1 md:col-span-2 lg:col-span-1">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Thermometer className="h-6 w-6 text-purple-800 dark:text-purple-200" />
                  <div>
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      Feels Like
                    </p>
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                      {Math.round(weatherData.feelsLike)}°C
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-6 w-6 text-purple-800 dark:text-purple-200" />
                  <div>
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      Daily Range
                    </p>
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                      {Math.round(weatherData.temperature - 5)}° -{" "}
                      {Math.round(weatherData.temperature + 3)}°
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comfort Level - Glass with Cyan Theme */}
        <Card className="bg-cyan-500/30 backdrop-blur-md border border-cyan-300/30 shadow-xl rounded-3xl text-gray-900 dark:text-white hover:shadow-2xl hover:bg-cyan-500/40 transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="h-8 w-8 text-cyan-800 dark:text-cyan-200" />
              <div className="text-right">
                <p className="text-lg font-bold text-cyan-900 dark:text-cyan-100">
                  {getComfortLevel(
                    weatherData.temperature,
                    weatherData.humidity
                  )}
                </p>
                <p className="text-sm text-cyan-800 dark:text-cyan-200">
                  Comfort Level
                </p>
              </div>
            </div>
            <p className="text-xs text-cyan-700 dark:text-cyan-300">
              Based on temp & humidity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info Section - Glass Effects with Color Themes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Weather Summary - Glass with Green Theme */}
        <Card className="bg-green-500/20 dark:bg-green-600/30 backdrop-blur-md border border-green-300/20 dark:border-green-500/30 shadow-lg rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-green-800 dark:text-green-100 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-700 dark:text-green-200" />
              Weather Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700 dark:text-green-200">
                  Today's High
                </span>
                <span className="font-semibold text-green-800 dark:text-green-100">
                  {Math.round(weatherData.temperature + 3)}°C
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700 dark:text-green-200">
                  Today's Low
                </span>
                <span className="font-semibold text-green-800 dark:text-green-100">
                  {Math.round(weatherData.temperature - 5)}°C
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700 dark:text-green-200">
                  Dew Point
                </span>
                <span className="font-semibold text-green-800 dark:text-green-100">
                  {Math.round(weatherData.temperature - 10)}°C
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Moon Phase - Glass with Emerald Theme */}
        <Card className="bg-emerald-500/20 dark:bg-emerald-600/30 backdrop-blur-md border border-emerald-300/20 dark:border-emerald-500/30 shadow-lg rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-emerald-800 dark:text-emerald-100 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-emerald-700 dark:text-emerald-200" />
              Moon Phase
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                <span className="text-2xl">🌓</span>
              </div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200 mb-1">
                First Quarter
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-300">
                Waxing moon, 52% visible
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Today's Highlights - Glass with Yellow Theme */}
        <Card className="bg-yellow-500/20 dark:bg-yellow-600/30 backdrop-blur-md border border-yellow-300/20 dark:border-yellow-500/30 shadow-lg rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-yellow-800 dark:text-yellow-100 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-yellow-700 dark:text-yellow-200" />
              Today's Highlights
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-lg flex items-center justify-center shadow-sm">
                  <Compass className="h-4 w-4 text-yellow-700 dark:text-yellow-200" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-100">
                    Wind Direction
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-200">
                    {getWindDirection(weatherData.windDirection)} (
                    {weatherData.windDirection}°)
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-lg flex items-center justify-center shadow-sm">
                  <Gauge className="h-4 w-4 text-yellow-700 dark:text-yellow-200" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-100">
                    Pressure Trend
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-200">
                    Stable
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
