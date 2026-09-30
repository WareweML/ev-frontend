import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,box-shadow,transform,opacity] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        outline: "border border-border bg-card shadow-border hover:shadow-border-hover hover:bg-card",
        ghost: "hover:bg-muted text-foreground",
        destructive: "bg-destructive text-primary-foreground hover:bg-destructive/90",
        ink: "bg-ink text-ink-foreground hover:bg-ink/90",
        inverse: "bg-ink-foreground text-ink hover:bg-ink-foreground/90",
        link: "text-primary underline-offset-4 hover:underline h-auto min-h-0 px-0",
      },
      size: {
        default: "h-12 min-h-12 px-5",
        sm: "h-10 min-h-10 px-3 text-sm rounded-[8px]",
        lg: "h-14 min-h-14 px-6 rounded-[12px] text-base",
        icon: "size-12 min-h-12 min-w-12",
        "icon-sm": "size-10 min-h-10 min-w-10 rounded-[8px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
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
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
