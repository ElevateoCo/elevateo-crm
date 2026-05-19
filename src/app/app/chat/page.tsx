import { MessageCircle } from 'lucide-react';

export default function ChatHome() {
  return (
    <div className="flex flex-1 items-center justify-center text-center p-10">
      <div className="max-w-sm">
        <MessageCircle className="mx-auto h-7 w-7 text-[var(--color-fg-dim)] mb-2" />
        <div className="text-[14px] font-semibold text-[var(--color-fg)]">Pick a room</div>
        <p className="text-[12px] text-[var(--color-fg-muted)] mt-1">
          Click a division channel on the left or start a direct message.
        </p>
      </div>
    </div>
  );
}
