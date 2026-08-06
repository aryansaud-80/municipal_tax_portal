'use client';

import { Controller, Control } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { LoginFormValues } from '@/features/auth/schema';

export function RememberMe({ control }: { control: Control<LoginFormValues> }) {
  return (
    <Controller
      control={control}
      name="rememberMe"
      render={({ field }) => (
        <div className="flex items-center gap-2">
          <Checkbox
            id="rememberMe"
            checked={field.value}
            onCheckedChange={field.onChange}
          />
          <Label htmlFor="rememberMe" className="cursor-pointer font-normal text-slate-600">
            Remember me on this device
          </Label>
        </div>
      )}
    />
  );
}