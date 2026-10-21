import { Loader2 } from "lucide-react";

interface InviteLoadingStateProps {
  message: string;
}

// Used by app/invite/onboarding/loading.tsx -- Next's automatic loading
// fallback while the server component above it validates the token, kept
// as its own component in case another invite-flow route needs the same
// spinner later.
export function InviteLoadingState({ message }: InviteLoadingStateProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-4">
      <Loader2 className="h-6 w-6 animate-spin text-clay" strokeWidth={2} />
      <p className="text-sm text-linen/55">{message}</p>
    </div>
  );
}