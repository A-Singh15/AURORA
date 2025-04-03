"use client"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"
import { Button } from "./button"
import { Upload, Send } from "lucide-react"

interface placeholderProps {
  placeholders: string[];
  currentPlaceholder: number;
  show: boolean;
}

// File upload button component
interface FileUploadButtonProps {
  onFileChange?: (file: File) => void;
}

// Animated placeholder component
const AnimatedPlaceholder = ({ placeholders, currentPlaceholder, show }: placeholderProps) => {
  if (!show) return null;

  return (
    <div className="absolute top-0 bottom-0 left-0 flex items-center pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.p
          initial={{ y: 5, opacity: 0 }}
          key={`current-placeholder-${currentPlaceholder}`}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -15, opacity: 0 }}
          transition={{ duration: 0.3, ease: "linear" }}
          className="dark:text-zinc-500 text-base sm:text-lg font-normal text-gray-500"
        >
          {placeholders[currentPlaceholder]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

const FileUploadButton = ({ onFileChange }: FileUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      if (onFileChange) onFileChange(files[0]);
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="*/*"
      />
      {selectedFile && (
        <span className="text-sm text-gray-600 dark:text-gray-400 mr-2 max-w-[150px] truncate">
          {selectedFile.name}
        </span>
      )}
      <Button
        type="button"
        onClick={handleFileUploadClick}
        variant='outline'
        size='icon'
      >
        <Upload />
      </Button>
    </>
  );
};
// Model selector component
const ModelSelector = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="w-full">
            <Select>
              <SelectTrigger className="w-full sm:w-[180px]" disabled={true}>
                <SelectValue placeholder="Choose your model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chatgpt-4o">ChatGPT 4o</SelectItem>
                <SelectItem value="claude-35">Claude 3.5</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
              </SelectContent>
            </Select>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Coming soon!
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Main input component
export function PlaceholdersAndVanishInput({
  placeholders,
  onSubmit,
}: {
  placeholders: string[]
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) {
  // State
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [value, setValue] = useState("");
  const [animating, setAnimating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [bottomPadding, setBottomPadding] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set isMounted after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Placeholder rotation logic
  useEffect(() => {
    const startAnimation = () => {
      intervalRef.current = setInterval(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
      }, 3000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible" && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else if (document.visibilityState === "visible") {
        startAnimation();
      }
    };

    startAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [placeholders]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = 'auto';
    const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
    textareaRef.current.style.height = `${newHeight}px`;
  };

  // Mobile keyboard handling
  useEffect(() => {
    if (!isMounted) return;

    const isMobile = window.innerWidth <= 640;
    if (!isMobile) {
      setBottomPadding(0);
      return;
    }
    const textareaElement = textareaRef.current;
    // handle viewport changes (mobile keyboard appearing)
    const handleViewportChange = () => {
      if (!isMobile) return;

      // Use visualViewport API if available
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;

        if (windowHeight - viewportHeight > 150) {
          setBottomPadding(windowHeight - viewportHeight);
        } else {
          setBottomPadding(0);
        }
      } else {
        // Fallback for browsers without visualViewport
        setBottomPadding(0);
      }

      // Adjust textarea height when anything changes
      adjustTextareaHeight();
    };

    // Set up event listeners
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      window.addEventListener('resize', handleViewportChange);
    }
    if (textareaElement) {
      textareaElement.addEventListener('input', adjustTextareaHeight);
    }

    // Initial adjustment
    handleViewportChange();

    return () => {
      // Clean up listeners
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleViewportChange);
      }
      if (textareaElement) {
        textareaElement.removeEventListener('input', adjustTextareaHeight);
      }
    };
  }, [isMounted, value]);

  // Submit handling
  const vanishAndSubmit = () => {
    if (!animating && value.trim()) {
      setAnimating(true);

      setTimeout(() => {
        setValue("");
        setAnimating(false);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }, 600);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    vanishAndSubmit();
    if (onSubmit) onSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey && !animating && value.trim()) {
      e.preventDefault();
      vanishAndSubmit();

      // Create a synthetic form event
      if (e.currentTarget.form) {
        const syntheticEvent = {
          currentTarget: e.currentTarget.form,
          preventDefault: () => { }
        } as React.FormEvent<HTMLFormElement>;

        if (onSubmit) onSubmit(syntheticEvent);
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 relative">
      <div
        ref={containerRef}
        className={cn(
          "bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-lg overflow-hidden max-w-3xl mx-auto",
          "fixed bottom-0 sm:static sm:bottom-auto z-50 sm:z-0",
          "sm:left-0 sm:right-0", // Full width on desktop
          "left-2 right-2", // Smaller margins on mobile
        )}
        style={{
          paddingBottom: isMounted ? bottomPadding : 0,
          transition: 'padding-bottom 0.2s ease-out',
          marginBottom: isMounted ? '12px' : '0'
        }}
      >
        {/* Mobile controls */}
        <div className="sm:hidden flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-zinc-800/50 border-t border-b border-gray-200 dark:border-zinc-700">
          <div className="flex-grow mr-2">
            <ModelSelector />
          </div>

          <div>
            <FileUploadButton onFileChange={setSelectedFile} />
          </div>
        </div>

        {selectedFile && (
          <div className="sm:hidden text-sm text-gray-600 dark:text-gray-400 px-4 py-1 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-700 truncate">
            {selectedFile.name}
          </div>
        )}

        {/* Input form */}
        <form
          className="relative px-4 py-3 sm:p-6"
          onSubmit={handleSubmit}
        >
          <div className="relative pr-10 sm:pr-14">
            {/* Auto-expanding textarea */}
            <motion.div
              animate={animating ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full relative"
            >
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  if (!animating) {
                    setValue(e.target.value);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder=""
                className="w-full resize-none overflow-hidden text-base sm:text-lg text-gray-700 dark:text-white bg-transparent border-0 focus:ring-0 focus:outline-none py-0.5 min-h-[28px] max-h-[120px]"
                rows={1}
              />

              {/* Animated placeholder */}
              <AnimatedPlaceholder
                placeholders={placeholders}
                currentPlaceholder={currentPlaceholder}
                show={!value && !animating}
              />
            </motion.div>

            {/* Send button */}
            <div className="absolute right-0 top-0 flex items-center h-full">
              <Button
                onClick={vanishAndSubmit}
                disabled={!value.trim()}
                size='icon'
                className="rounded-full bg-blue-400 hover:bg-blue-500 transition-colors w-8 h-8 sm:w-10 sm:h-10 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </form>

        {/* Desktop controls */}
        <div className="hidden sm:flex items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <ModelSelector />
          </div>

          <div className="flex items-center gap-2">
            <FileUploadButton onFileChange={setSelectedFile} />
          </div>
        </div>
      </div>

    </div>

  );
}
