import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Primary = solid brand green with BLACK text (14:1 contrast). Flat: no glow, no gradient, no pill.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-neon text-black hover:brightness-110",
        secondary: "border border-ink/25 text-ink hover:border-accent hover:text-accent",
        ghost: "text-ink hover:bg-muted",
        dark: "bg-ink text-bg hover:opacity-90",
        onNavy: "border border-white/30 text-white hover:border-neon hover:text-neon",
      },
      size: { sm: "h-9 px-4 text-sm", md: "h-11 px-5 text-[15px]", lg: "h-[52px] px-7 text-base" },
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
