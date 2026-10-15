import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert
      variant="destructive"
      role="alert"
      aria-live="assertive"
      className="border-danger/30 bg-danger/10 text-danger [&>svg]:text-danger"
    >
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
