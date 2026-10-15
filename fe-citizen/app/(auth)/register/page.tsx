"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Landmark } from "lucide-react";
import { registerSchema, RegisterValues } from "@/features/auth/schema";
import { useRegister, getAuthErrorMessage } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const fields: Array<{
  name: keyof RegisterValues;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}> = [
  { name: "firstName", label: "First name", placeholder: "Ram", autoComplete: "given-name" },
  { name: "lastName", label: "Last name", placeholder: "Sharma", autoComplete: "family-name" },
  { name: "username", label: "Username", placeholder: "ramsharma", autoComplete: "username" },
  { name: "email", label: "Email", type: "email", placeholder: "you@example.com", autoComplete: "email" },
  { name: "phoneNumber", label: "Phone number", placeholder: "+9779800000000", autoComplete: "tel" },
  { name: "password", label: "Password", type: "password", placeholder: "••••••••", autoComplete: "new-password" },
];

export default function RegisterPage() {
  const register = useRegister();
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Landmark className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Create your citizen account</h1>
          <p className="text-sm text-muted-foreground">
            Register to submit properties and pay municipal taxes online
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign up</CardTitle>
            <CardDescription>
              Your account is created with the Citizen role only
            </CardDescription>
          </CardHeader>
          <CardContent>
            {register.isError ? (
              <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {getAuthErrorMessage(register.error)}
              </div>
            ) : null}

            <form
              onSubmit={handleSubmit((values) => register.mutate(values))}
              className="grid gap-4 sm:grid-cols-2"
            >
              {fields.map((field) => (
                <div
                  key={field.name}
                  className={`space-y-2 ${field.name === "email" || field.name === "password" ? "sm:col-span-2" : ""}`}
                >
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    type={field.type ?? "text"}
                    autoComplete={field.autoComplete}
                    placeholder={field.placeholder}
                    {...formRegister(field.name)}
                  />
                  {errors[field.name] ? (
                    <p className="text-xs text-destructive">
                      {errors[field.name]?.message}
                    </p>
                  ) : null}
                </div>
              ))}

              <Button
                type="submit"
                className="w-full sm:col-span-2"
                disabled={register.isPending}
              >
                {register.isPending ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
