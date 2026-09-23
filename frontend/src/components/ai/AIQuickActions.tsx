interface AIQuickActionsProps {
  disabled?: boolean;
  onSelect: (message: string) => void;
}

/* ============================================================
   QUICK ACTIONS
============================================================ */

const QUICK_ACTIONS = [
  "What is my wallet balance?",
  "What is my latest deposit?",
  "What is my latest withdrawal?",
  "Show my recent transactions.",
  "Show my support tickets.",
];

/* ============================================================
   COMPONENT
============================================================ */

export default function AIQuickActions({
  disabled = false,
  onSelect,
}: AIQuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_ACTIONS.map(
        (action) => (
          <button
            key={action}
            type="button"
            disabled={disabled}
            onClick={() =>
              onSelect(action)
            }
            className="
              rounded-full
              border
              border-slate-200
              bg-white
              px-3
              py-2
              text-[11px]
              font-medium
              text-slate-600
              transition
              hover:border-indigo-200
              hover:bg-indigo-50
              hover:text-indigo-600
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {action}
          </button>
        ),
      )}
    </div>
  );
}