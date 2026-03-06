import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="18"
      height="18"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 9a6 6 0 1 1 12 0v5l2 2H4l2-2V9z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </BaseIcon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m6 9 6 6 6-6" />
    </BaseIcon>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="8" cy="12" r="3" />
      <path d="M11 12h9M17 12v3M20 12v2" />
    </BaseIcon>
  );
}

export function GaugeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 14a8 8 0 1 1 16 0" />
      <path d="m12 12 4-3" />
      <circle cx="12" cy="12" r="1.1" />
    </BaseIcon>
  );
}

export function LogsIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </BaseIcon>
  );
}

export function AnalyticsIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 18V9M11 18V5M17 18v-7" />
      <path d="M3 18h18" />
    </BaseIcon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </BaseIcon>
  );
}
