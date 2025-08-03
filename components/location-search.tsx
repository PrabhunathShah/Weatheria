"use client"

import { useState, useRef, useEffect } from "react"
import { Search, MapPin, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface LocationResult {
  name: string
  country: string
  state?: string
  lat: number
  lon: number
}

interface LocationSearchProps {
  onLocationSelect: (lat: number, lon: number, name: string) => void
}

export function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<LocationResult[]>([])
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setQuery("")
        setResults([])
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const searchLocations = async () => {
      if (query.length < 3) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/geocoding?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.slice(0, 5))
        }
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchLocations, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  const handleLocationClick = (location: LocationResult) => {
    const locationName = location.state
      ? `${location.name}, ${location.state}, ${location.country}`
      : `${location.name}, ${location.country}`

    onLocationSelect(location.lat, location.lon, locationName)
    setIsOpen(false)
    setQuery("")
    setResults([])
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleClearSearch = () => {
    setQuery("")
    setResults([])
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="relative w-full max-w-xs" ref={searchRef}>
      {/* Search Input - Always Visible */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          placeholder="Search location..."
          className="pl-10 pr-10 w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 shadow-lg rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {query && (
          <Button
            onClick={handleClearSearch}
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-600"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query.length >= 3 || loading || results.length > 0) && (
        <Card className="absolute top-12 right-0 w-80 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-slate-200 dark:border-slate-700 shadow-2xl rounded-lg max-h-80 overflow-hidden">
          <CardContent className="p-0">
            {loading && (
              <div className="flex items-center justify-center py-4 px-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">Searching...</span>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="max-h-72 overflow-y-auto">
                {results.map((location, index) => (
                  <button
                    key={index}
                    onClick={() => handleLocationClick(location)}
                    className="w-full text-left p-4 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-200 flex items-center space-x-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                  >
                    <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{location.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {location.state ? `${location.state}, ` : ""}
                        {location.country}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && query.length >= 3 && results.length === 0 && (
              <div className="py-8 px-4 text-center">
                <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">No locations found</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Try a different search term</p>
              </div>
            )}

            {query.length > 0 && query.length < 3 && (
              <div className="py-4 px-4 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm">Type at least 3 characters to search</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
