import clsx from "clsx";

type AnimatedButtonProps = {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";

  variant?: "purple" | "red" | "green";
  icon?: React.ReactNode;

  shine?: boolean;
  tiltOnClick?: boolean;
  darkBg?: boolean;
  floatingIcon?: boolean;
  cursorFollow?: boolean;

  disabled?: boolean;
  className?: string;
};

export function AnimatedButton({
  children,
  onClick,
  type = "button",
  variant = "purple",
  icon,

  shine = false,
  tiltOnClick = false,
  darkBg = false,
  floatingIcon = false,
  cursorFollow = true,

  disabled = false,
  className,
}: AnimatedButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={(e) => {
        if (!cursorFollow || disabled) return;
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        btn.style.setProperty("--x", `${x}%`);
        btn.style.setProperty("--y", `${y}%`);
      }}
      className={clsx(
        "animated-btn p-2.5",
        `animated-btn--${variant}`,
        shine && "animated-btn--shine",
        tiltOnClick && "animated-btn--tilt",
        cursorFollow && "animated-btn--cursor",
        darkBg && "animated-btn--dark-bg",
        floatingIcon && "animated-btn--floating-icon",
        disabled && "animated-btn--disabled",
        className
      )}
    >
      {icon && <span className="animated-btn__icon">{icon}</span>}
      {children}
    </button>
  );
}
