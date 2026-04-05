import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiMessageSquare, FiMic, FiSend, FiX } from "react-icons/fi";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
};

export function ChatbotPanel() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Ask me about resume improvements, applications, or hiring shortcuts.",
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const supportsVoice = useMemo(
    () => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    [],
  );

  function speak(text: string) {
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    speech.rate = 1;
    window.speechSynthesis.speak(speech);
  }

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), sender: "user", text: trimmed },
    ]);
    setInput("");
    setIsSending(true);

    try {
      const response = await api.askChatbot(trimmed);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), sender: "bot", text: response.response },
      ]);
      speak(response.response);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          sender: "bot",
          text: "I hit a server issue. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function toggleVoice() {
    if (!supportsVoice) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      void sendMessage(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }

  return (
    <>
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        whileHover={{ y: -2 }}
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-2xl shadow-sky-200/80"
      >
        {open ? <FiX className="size-5" /> : <FiMessageSquare className="size-5" />}
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 z-40 flex h-[32rem] w-[min(94vw,24rem)] flex-col overflow-hidden rounded-[28px] border border-border/80 bg-white/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="border-b border-sky-100 bg-[linear-gradient(135deg,rgba(224,242,254,0.96),rgba(236,253,245,0.96))] px-5 py-4 text-slate-900">
              <p className="font-display text-xl">AI Wingman</p>
              <p className="text-xs text-slate-600">
                Fast guidance for resumes, jobs, and hiring steps.
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-sm",
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {isSending ? (
                <div className="text-xs font-medium text-slate-500">
                  AI assistant is thinking...
                </div>
              ) : null}
            </div>

            <form
              className="flex items-center gap-2 border-t border-border/80 bg-card/95 px-3 py-3"
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage(input);
              }}
            >
              <button
                type="button"
                onClick={toggleVoice}
                disabled={!supportsVoice}
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition",
                  isListening && "border-rose-200 bg-rose-500 text-white",
                  !supportsVoice && "cursor-not-allowed opacity-50",
                )}
              >
                <FiMic className="size-4" />
              </button>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask something useful..."
                className="h-11 flex-1 rounded-full border border-border bg-background/85 px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-cyan-400"
              />
              <button
                type="submit"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/85"
              >
                <FiSend className="size-4" />
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
