import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Primary = gradient fill with NAVY text (white on teal fails WCAG AA; navy on teal/sky is ~7:1).
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand-gradient text-navy shadow-glow hover:brightness-105 hover:-translate-y-0.5",
        secondary: "border border-line bg-surface text-ink hover:border-ink/30 hover:-translate-y-0.5",
        ghost: "text-ink hover:bg-muted",
        dark: "bg-navy text-white hover:bg-navy-700",
        onNavy: "border border-white/25 text-white hover:bg-white/10",
      },
      size: { sm: "h-9 px-4 text-sm", md: "h-11 px-6 text-[15px]", lg: "h-14 px-8 text-base" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";
