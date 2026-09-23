import {
  useRef,
  useEffect,
} from "react";
import {
  Send,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

interface AIInputProps {
  value: string;
  loading?: boolean;
  maxLength?: number;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function AIInput({
  value,
  loading = false,
  maxLength = 1000,
  onChange,
  onSubmit,
}: AIInputProps) {
  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null,
    );

  /* ==========================================================
     AUTO FOCUS AFTER AI RESPONSE
  ========================================================== */

  useEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }, [loading]);

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (
        value.trim() &&
        !loading
      ) {
        onSubmit();
      }
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <textarea
          ref={textareaRef}
          id="ai-support-message"
          name="ai-support-message"
          rows={3}
          maxLength={maxLength}
          value={value}
          disabled={loading}
          onChange={(event) =>
            onChange(event.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Ask our AI support assistant..."
          className="
            w-full
            resize-none
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            px-4
            py-3
            text-sm
            text-slate-800
            outline-none
            transition
            placeholder:text-slate-400
            focus:border-indigo-400
            focus:bg-white
            focus:ring-4
            focus:ring-indigo-500/10
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        />

        <div className="mt-1 flex items-center justify-between">
          <p className="text-[10px] text-slate-400">
            Enter to send · Shift + Enter
            for new line
          </p>

          <p className="text-[10px] font-medium text-slate-400">
            {value.length}/{maxLength}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={
          loading ||
          !value.trim()
        }
        className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-gradient-to-r
          from-indigo-600
          to-violet-600
          text-white
          shadow-lg
          shadow-indigo-500/20
          transition-all
          duration-200
          hover:-translate-y-0.5
          hover:from-indigo-500
          hover:to-violet-500
          disabled:cursor-not-allowed
          disabled:opacity-50
          disabled:hover:translate-y-0
        "
        aria-label="Send message"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}