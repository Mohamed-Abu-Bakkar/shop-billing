import * as React from "react";

import { cn } from "@/lib/utils";

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loadingText?: string;
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, disabled, loadingText, onClick, children, ...props }, ref) => {
    const [loading, setLoading] = React.useState(false);

    const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading || !onClick) return;
      setLoading(true);
      const start = Date.now();
      try {
        const result = onClick(event);
        if (result && typeof result.then === 'function') {
          await result;
        }
      } finally {
        const end = Date.now();
        const elapsed = end - start;
        const delay = Math.max(0, 300 - elapsed);
        await new Promise(resolve => setTimeout(resolve, delay));
        setLoading(false);
      }
    };

    return (
      <button
        ref={ref}
        type={props.type ?? "button"}
        {...props}
        onClick={handleClick}
        disabled={disabled || loading}
        aria-busy={loading}
        data-loading={loading ? "true" : undefined}
        className={cn(className, loading && "cursor-wait opacity-70")}
      >
        {loading && loadingText ? loadingText : children}
      </button>
    );
  },
);
LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
