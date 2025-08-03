export const weatherImages = {
  // Clear/Sunny Weather
  clear: "https://i.pinimg.com/1200x/fb/21/0a/fb210a2921f07846a47315c8c6debcc7.jpg",
  sunny: "https://i.pinimg.com/1200x/cd/61/2c/cd612cb00864943d7ec549a8476a2a40.jpg",

  // Cloudy Weather
  cloudy: "https://i.pinimg.com/1200x/8f/41/e0/8f41e01df00274a8fcaf16ff951e2cec.jpg",
  overcast: "https://i.pinimg.com/1200x/6d/0e/50/6d0e50e05fa85fd0b83e3a5ce2c7d1bc.jpg",
  partlyCloudy: "https://i.pinimg.com/1200x/b2/9d/5b/b29d5be21fb6340b209dc12c557f9c17.jpg",

  // Rainy Weather
  rain: "https://i.pinimg.com/1200x/c2/1c/8d/c21c8dda09d5eb43af67eaa32ce4f838.jpg",
  lightRain: "https://i.pinimg.com/1200x/92/e5/50/92e550f717cc719582630b1ae2cea5d5.jpg",
  heavyRain: "https://i.pinimg.com/1200x/f7/f8/c4/f7f8c46cac74245ed1ed64a9381c7db3.jpg",

  // Drizzle
  drizzle: "https://i.pinimg.com/1200x/92/8b/bb/928bbb8c07c7131d77acf93d358bb3d3.jpg",
  mist: "https://i.pinimg.com/1200x/3b/0f/5b/3b0f5be0009bb8c8b0697e92ef3de64b.jpg",

  // Thunderstorm
  thunderstorm: "https://i.pinimg.com/1200x/f7/f8/c4/f7f8c46cac74245ed1ed64a9381c7db3.jpg", // Using heavy rain for storms
  storm: "https://i.pinimg.com/1200x/f7/f8/c4/f7f8c46cac74245ed1ed64a9381c7db3.jpg",

  // Snow
  snow: "https://i.pinimg.com/1200x/33/ab/03/33ab03a9659060a51bd99e4424f36881.jpg",
  lightSnow: "https://i.pinimg.com/1200x/64/92/e9/6492e92ba27852433d6e00fd82c757ac.jpg",
  heavySnow: "https://i.pinimg.com/1200x/41/cd/ad/41cdade3d0e78c5346775ccff0a012b9.jpg",

  // Fog/Haze
  fog: "https://i.pinimg.com/1200x/65/97/99/659799feceed08fa9590da48a4bb6f75.jpg",
  haze: "https://i.pinimg.com/1200x/32/6a/71/326a71e5b4827511898e57b6cff0ce08.jpg",

  // Default fallback
  default: "https://i.pinimg.com/1200x/9a/0a/db/9a0adbac3c7cfbf77acb759e5234acbf.jpg",
}

// Function to get the appropriate background image based on weather condition
export function getWeatherBackgroundImage(condition: string): string {
  const conditionLower = condition.toLowerCase()

  // Clear/Sunny conditions
  if (conditionLower.includes("clear")) {
    return weatherImages.clear
  }
  if (conditionLower.includes("sunny")) {
    return weatherImages.sunny
  }

  // Cloudy conditions
  if (conditionLower.includes("cloud")) {
    if (conditionLower.includes("partly")) {
      return weatherImages.partlyCloudy
    }
    if (conditionLower.includes("overcast")) {
      return weatherImages.overcast
    }
    return weatherImages.cloudy
  }

  // Rain conditions
  if (conditionLower.includes("rain")) {
    if (conditionLower.includes("light")) {
      return weatherImages.lightRain
    }
    if (conditionLower.includes("heavy")) {
      return weatherImages.heavyRain
    }
    return weatherImages.rain
  }

  // Drizzle conditions
  if (conditionLower.includes("drizzle")) {
    return weatherImages.drizzle
  }

  // Mist conditions
  if (conditionLower.includes("mist")) {
    return weatherImages.mist
  }

  // Storm conditions
  if (conditionLower.includes("storm") || conditionLower.includes("thunder")) {
    return weatherImages.thunderstorm
  }

  // Snow conditions
  if (conditionLower.includes("snow")) {
    if (conditionLower.includes("light")) {
      return weatherImages.lightSnow
    }
    if (conditionLower.includes("heavy") || conditionLower.includes("blizzard")) {
      return weatherImages.heavySnow
    }
    return weatherImages.snow
  }

  // Fog conditions
  if (conditionLower.includes("fog")) {
    return weatherImages.fog
  }

  // Haze conditions
  if (conditionLower.includes("haze")) {
    return weatherImages.haze
  }

  // Default fallback
  return weatherImages.default
}

// Alternative function for placeholder images (for development/testing)
export function getWeatherPlaceholderImage(condition: string): string {
  const conditionLower = condition.toLowerCase()

  if (conditionLower.includes("clear") || conditionLower.includes("sunny")) {
    return "/placeholder.svg?height=400&width=600&text=Sunny+Clear+Sky"
  }

  if (conditionLower.includes("cloud")) {
    return "/placeholder.svg?height=400&width=600&text=Cloudy+Overcast+Sky"
  }

  if (conditionLower.includes("rain")) {
    return "/placeholder.svg?height=400&width=600&text=Rainy+Weather"
  }

  if (conditionLower.includes("storm") || conditionLower.includes("thunder")) {
    return "/placeholder.svg?height=400&width=600&text=Thunderstorm+Lightning"
  }

  if (conditionLower.includes("snow")) {
    return "/placeholder.svg?height=400&width=600&text=Snowy+Winter+Weather"
  }

  if (conditionLower.includes("drizzle")) {
    return "/placeholder.svg?height=400&width=600&text=Light+Drizzle"
  }

  if (conditionLower.includes("fog")) {
    return "/placeholder.svg?height=400&width=600&text=Foggy+Weather"
  }

  return "/placeholder.svg?height=400&width=600&text=Default+Weather"
}

// Weather image categories for easy management
export const weatherImageCategories = {
  sunny: ["clear", "sunny"],
  cloudy: ["cloudy", "overcast", "partlyCloudy"],
  rainy: ["rain", "lightRain", "heavyRain"],
  stormy: ["thunderstorm", "storm"],
  snowy: ["snow", "lightSnow", "heavySnow"],
  misty: ["drizzle", "mist", "fog", "haze"],
}

// Function to validate if all image URLs are properly configured
export function validateWeatherImages(): { isValid: boolean; missingImages: string[] } {
  const missingImages: string[] = []

  Object.entries(weatherImages).forEach(([key, url]) => {
    if (url.includes("your-domain.com") || url.includes("placeholder")) {
      missingImages.push(key)
    }
  })

  return {
    isValid: missingImages.length === 0,
    missingImages,
  }
}
