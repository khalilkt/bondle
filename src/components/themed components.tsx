import { forwardRef } from "react";
import { cx } from "../utils/cx";

const ThemedComp = forwardRef<
  HTMLButtonElement,
  { clickable?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ clickable = true, ...buttonProps }, ref) => {
  const { className, children, ...restProps } = buttonProps;

  return (
    <button
      {...restProps}
      ref={ref}
      className={cx(
        "ThemedButton gap-x-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center",
        clickable && "active:scale-95 cursor-pointer",
        className,
      )}
    >
      {children}
    </button>
  );
});

export { ThemedComp as ThemedButton };
