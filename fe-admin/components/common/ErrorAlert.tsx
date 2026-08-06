import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert
      variant="destructive"
      role="alert"
      aria-live="assertive"
      className="border-red-200 bg-red-50 text-red-800 [&>svg]:text-red-600"
    >
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
