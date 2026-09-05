import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border-1.5 border-ink cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--ink)]",
  {
    variants: {
      variant: {
        default: "bg-ink text-paper shadow-[3px_3px_0_0_var(--ink)] hover:bg-ink/90",
        pink: "bg-pink text-ink shadow-[3px_3px_0_0_var(--ink)] hover:bg-pink/90",
        mint: "bg-mint text-ink shadow-[3px_3px_0_0_var(--ink)] hover:bg-mint/90",
        sun: "bg-sun text-ink shadow-[3px_3px_0_0_var(--ink)] hover:bg-sun/90",
        outline: "bg-card text-ink shadow-[3px_3px_0_0_var(--ink)] hover:bg-muted",
        ghost: "border-transparent bg-transparent shadow-none hover:bg-muted text-ink",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10 p-0 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
