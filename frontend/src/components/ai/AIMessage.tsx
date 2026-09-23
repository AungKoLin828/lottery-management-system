import {
  Bot,
  Headphones,
  User,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

export type AIMessageSender =
  | "USER"
  | "AI"
  | "ADMIN";

export interface AIChatMessage {
  id: string;
  sender: AIMessageSender;
  message: string;
  createdAt: string;
}

interface AIMessageProps {
  item: AIChatMessage;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function AIMessage({
  item,
}: AIMessageProps) {
  const userMessage =
    item.sender === "USER";

  const aiMessage =
    item.sender === "AI";

  return (
    <div
      className={`flex ${
        userMessage
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`flex max-w-[90%] gap-2.5 sm:max-w-[78%] ${
          userMessage
            ? "flex-row-reverse"
            : "flex-row"
        }`}
      >
        {/* ==================================================
            AVATAR
        =================================================== */}

        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            userMessage
              ? "bg-indigo-100 text-indigo-600"
              : aiMessage
                ? "bg-violet-100 text-violet-600"
                : "bg-emerald-100 text-emerald-600"
          }`}
        >
          {userMessage ? (
            <User className="h-4 w-4" />
          ) : aiMessage ? (
            <Bot className="h-4 w-4" />
          ) : (
            <Headphones className="h-4 w-4" />
          )}
        </div>

        {/* ==================================================
            MESSAGE
        =================================================== */}

        <div
          className={`flex flex-col ${
            userMessage
              ? "items-end"
              : "items-start"
          }`}
        >
          {/* Sender */}

          <div
            className={`mb-1 flex items-center gap-2 ${
              userMessage
                ? "flex-row-reverse"
                : ""
            }`}
          >
            <span className="text-[10px] font-bold text-slate-500">
              {userMessage
                ? "You"
                : aiMessage
                  ? "AI Support"
                  : "Support Team"}
            </span>

            <span className="text-[9px] text-slate-400">
              {item.createdAt}
            </span>
          </div>

          {/* Bubble */}

          <div
            className={`rounded-2xl px-4 py-3 ${
              userMessage
                ? "rounded-tr-md bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                : aiMessage
                  ? "rounded-tl-md border border-violet-100 bg-white text-slate-700 shadow-sm"
                  : "rounded-tl-md border border-slate-200 bg-white text-slate-700 shadow-sm"
            }`}
          >
            <p className="whitespace-pre-wrap text-sm leading-6">
              {item.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}