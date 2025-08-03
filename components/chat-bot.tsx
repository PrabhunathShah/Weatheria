"use client";
import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Minimize2,
  Maximize2,
  Sparkles,
  User,
  Zap,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

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

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  weatherData: WeatherData | null;
}

export function ChatBot({ isOpen, onClose, weatherData }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm WeatherBot, your intelligent weather companion! 🌟\n\nI can help you with:\n• Current weather insights\n• Detailed forecasts\n• Weather recommendations\n• Climate analysis\n\nWhat would you like to know about today's weather?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "error" | "testing"
  >("connected");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Test API connection when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 1) {
      testConnection();
    }
  }, [isOpen]);

  const testConnection = async () => {
    setConnectionStatus("testing");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "test",
          weatherData: weatherData,
        }),
      });
      if (response.ok) {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("error");
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionStatus("error");
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      console.log("Sending message to API:", currentInput);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          weatherData: weatherData,
        }),
      });
      console.log("API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("API Response data:", data);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          data.response ||
          "I received your message but couldn't generate a proper response.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setConnectionStatus("connected");
    } catch (error) {
      console.error("Chat error:", error);
      setConnectionStatus("error");
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I apologize, but I'm experiencing some technical difficulties right now. Please check the browser console for more details and try again in a moment! ⚡",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "What's the weather like today?",
    "Should I bring an umbrella?",
    "What should I wear outside?",
    "Is it good for outdoor activities?",
  ];

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <Card
        className={`w-full max-w-2xl mx-auto bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 transition-all duration-300 rounded-xl ${
          isMinimized
            ? "h-20 animate-in slide-in-from-bottom-4"
            : "h-[70vh] sm:h-[580px] animate-in slide-in-from-bottom-4"
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-5 border-b border-white/20 dark:border-slate-700 bg-gradient-to-r from-emerald-600/70 via-green-700/70 to-emerald-800/70 text-white rounded-t-xl backdrop-blur-md">
          <CardTitle className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div
                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                  connectionStatus === "connected"
                    ? "bg-green-400 animate-pulse"
                    : connectionStatus === "error"
                    ? "bg-red-400"
                    : "bg-yellow-400 animate-pulse"
                }`}
              ></div>
            </div>
            <div>
              <span className="text-white font-bold text-lg">WeatherBot</span>
              <p className="text-white/80 text-xs font-normal">
                AI Weather Assistant{" "}
                {connectionStatus === "error" && (
                  <span className="text-red-200">• Connection Issue</span>
                )}
                {connectionStatus === "testing" && (
                  <span className="text-yellow-200">• Testing Connection</span>
                )}
              </p>
            </div>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20 border-0 h-8 w-8"
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 border-0 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[calc(100%-72px)] sm:h-[calc(100%-80px)]">
            {/* Connection Status Warning */}
            {connectionStatus === "error" && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    Connection issue detected. Check browser console for
                    details.
                  </p>
                  <Button
                    onClick={testConnection}
                    size="sm"
                    variant="outline"
                    className="ml-auto bg-transparent"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}
            <ScrollArea
              className="flex-1 p-3 sm:p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              ref={scrollAreaRef}
            >
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[90%] sm:max-w-[85%] ${
                        message.sender === "user"
                          ? "flex-row-reverse space-x-reverse"
                          : ""
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                          message.sender === "user"
                            ? "bg-gradient-to-br from-emerald-600 to-green-700 text-white" // Changed for user avatar
                            : "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-slate-700 dark:to-slate-600 text-indigo-600 dark:text-indigo-400"
                        }`}
                      >
                        {message.sender === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`rounded-xl px-4 py-2 shadow-md border ${
                          message.sender === "user"
                            ? "bg-gradient-to-br from-emerald-600 to-green-700 text-white border-emerald-500 rounded-br-none" // Changed for user message bubble
                            : "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-600 rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender === "user"
                              ? "text-emerald-100"
                              : "text-slate-500 dark:text-slate-400" // Changed for user timestamp
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2 max-w-[90%] sm:max-w-[85%]">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shadow-sm">
                        <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                      </div>
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl rounded-bl-none px-4 py-2 shadow-md border border-slate-200 dark:border-slate-600">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Quick Questions */}
                {messages.length === 1 && !isLoading && (
                  <div className="space-y-3 pt-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
                      Quick questions to get started:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {quickQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickQuestion(question)}
                          className="text-left justify-start h-auto py-2 px-3 text-xs bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 hover:from-blue-100 hover:to-purple-100 dark:hover:from-slate-700 dark:hover:to-slate-600 border-blue-200 dark:border-slate-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <Zap className="h-3 w-3 mr-2 text-blue-500 flex-shrink-0" />
                          <span className="break-words">{question}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about the weather..."
                  disabled={isLoading}
                  className="flex-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-0 rounded-full px-4 py-2 shadow-sm text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="rounded-full bg-gradient-to-br from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 border-0 h-10 w-10 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
                Powered by AI • Press Enter to send
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
