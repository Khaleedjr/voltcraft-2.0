/**
 * The admin's icons, drawn for it: a 20-unit grid, 1.6 strokes, round joins,
 * in currentColor — the same hand as the rest of the site's line work.
 */

type IconProps = { className?: string; title?: string };

function Svg({ className = "size-[18px]", title, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export const Icon = {
  Overview: (p: IconProps) => (
    <Svg {...p}>
      <rect x="3" y="3" width="6" height="8" rx="1" />
      <rect x="11" y="3" width="6" height="5" rx="1" />
      <rect x="3" y="13" width="6" height="4" rx="1" />
      <rect x="11" y="10" width="6" height="7" rx="1" />
    </Svg>
  ),
  Orders: (p: IconProps) => (
    <Svg {...p}>
      <path d="M5 2.5h10v15l-2-1.3-1.7 1.3-1.6-1.3-1.7 1.3L6.3 16.2 5 17.5z" />
      <path d="M7.5 6.5h5M7.5 9.5h5M7.5 12.5h3" />
    </Svg>
  ),
  /** an IC package — this is a components shop */
  Products: (p: IconProps) => (
    <Svg {...p}>
      <rect x="5" y="5" width="10" height="10" rx="1" />
      <path d="M8 2.5V5M12 2.5V5M8 15v2.5M12 15v2.5M2.5 8H5M2.5 12H5M15 8h2.5M15 12h2.5" />
      <circle cx="8" cy="8" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  ),
  /** parts bins on a shelf */
  Stock: (p: IconProps) => (
    <Svg {...p}>
      <path d="M2.5 17.5h15" />
      <path d="M3.5 11.5h6v6h-6zM10.5 11.5h6v6h-6zM7 5.5h6v6H7z" />
      <path d="M5.5 14h2M12.5 14h2M9 8h2" />
    </Svg>
  ),
  Customers: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="7.5" cy="7" r="2.8" />
      <path d="M2.5 16.5c.6-2.8 2.6-4.3 5-4.3s4.4 1.5 5 4.3" />
      <path d="M13 4.6a2.6 2.6 0 0 1 0 5M14.5 12.4c1.6.5 2.7 1.9 3 4.1" />
    </Svg>
  ),
  Analytics: (p: IconProps) => (
    <Svg {...p}>
      <path d="M3 17.5h14" />
      <path d="M5 14.5v-3M8.5 14.5V9M12 14.5v-4M15.5 14.5V6" />
      <path d="M4.5 8.5 8 5.5l3 2.5 5-5" />
    </Svg>
  ),
  Shop: (p: IconProps) => (
    <Svg {...p}>
      <path d="M3 8v9h14V8" />
      <path d="M2.5 8 4 3h12l1.5 5c0 1.2-1 2-2.1 2S13.3 9.2 13.3 8c0 1.2-1 2-2.2 2S9 9.2 9 8c0 1.2-1 2-2.1 2S4.7 9.2 4.7 8c0 1.2-1 2-2.2 0" />
      <path d="M8 17v-4h4v4" />
    </Svg>
  ),
  SignOut: (p: IconProps) => (
    <Svg {...p}>
      <path d="M11 3.5H4.5v13H11" />
      <path d="M8.5 10h9M14.5 7l3 3-3 3" />
    </Svg>
  ),
  Search: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="8.5" cy="8.5" r="5" />
      <path d="m12.3 12.3 4.2 4.2" />
    </Svg>
  ),
  Plus: (p: IconProps) => (
    <Svg {...p}>
      <path d="M10 4v12M4 10h12" />
    </Svg>
  ),
  Minus: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4 10h12" />
    </Svg>
  ),
  Close: (p: IconProps) => (
    <Svg {...p}>
      <path d="m5 5 10 10M15 5 5 15" />
    </Svg>
  ),
  Check: (p: IconProps) => (
    <Svg {...p}>
      <path d="m4 10.5 4 4 8-9" />
    </Svg>
  ),
  ChevronLeft: (p: IconProps) => (
    <Svg {...p}>
      <path d="m12 4.5-5.5 5.5 5.5 5.5" />
    </Svg>
  ),
  ChevronRight: (p: IconProps) => (
    <Svg {...p}>
      <path d="m8 4.5 5.5 5.5L8 15.5" />
    </Svg>
  ),
  ChevronDown: (p: IconProps) => (
    <Svg {...p}>
      <path d="m4.5 8 5.5 5.5L15.5 8" />
    </Svg>
  ),
  External: (p: IconProps) => (
    <Svg {...p}>
      <path d="M11.5 3.5h5v5M16.5 3.5 9 11" />
      <path d="M14 11.5v4a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" />
    </Svg>
  ),
  Image: (p: IconProps) => (
    <Svg {...p}>
      <rect x="2.5" y="3.5" width="15" height="13" rx="1" />
      <circle cx="7" cy="8" r="1.5" />
      <path d="m2.5 14 4.5-4 3.5 3 2.5-2 4.5 4" />
    </Svg>
  ),
  Upload: (p: IconProps) => (
    <Svg {...p}>
      <path d="M10 13.5V3.5M6 7.5l4-4 4 4" />
      <path d="M3.5 13v3.5h13V13" />
    </Svg>
  ),
  Trash: (p: IconProps) => (
    <Svg {...p}>
      <path d="M3.5 5.5h13M8 5.5V3.5h4v2M5 5.5l.8 11h8.4l.8-11" />
      <path d="M8.3 8.5v5M11.7 8.5v5" />
    </Svg>
  ),
  Restore: (p: IconProps) => (
    <Svg {...p}>
      <path d="M3.5 4v4h4" />
      <path d="M3.9 8A6.5 6.5 0 1 1 3.5 11" />
    </Svg>
  ),
  Copy: (p: IconProps) => (
    <Svg {...p}>
      <rect x="6.5" y="6.5" width="10" height="10" rx="1" />
      <path d="M13.5 6.5v-2a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" />
    </Svg>
  ),
  Edit: (p: IconProps) => (
    <Svg {...p}>
      <path d="M12.5 3.5 16.5 7.5 7 17H3v-4z" />
      <path d="m10.5 5.5 4 4" />
    </Svg>
  ),
  Alert: (p: IconProps) => (
    <Svg {...p}>
      <path d="M10 2.8 18 16.5H2z" />
      <path d="M10 8v4" />
      <circle cx="10" cy="14.4" r="0.6" fill="currentColor" />
    </Svg>
  ),
  Download: (p: IconProps) => (
    <Svg {...p}>
      <path d="M10 3.5v10M6 9.5l4 4 4-4" />
      <path d="M3.5 13v3.5h13V13" />
    </Svg>
  ),
  Menu: (p: IconProps) => (
    <Svg {...p}>
      <path d="M3 5.5h14M3 10h14M3 14.5h14" />
    </Svg>
  ),
  Truck: (p: IconProps) => (
    <Svg {...p}>
      <path d="M2 5.5h10v8H2zM12 8.5h3.2l2.3 2.8v2.2H12" />
      <circle cx="5.5" cy="15" r="1.6" />
      <circle cx="14.5" cy="15" r="1.6" />
    </Svg>
  ),
  Cash: (p: IconProps) => (
    <Svg {...p}>
      <rect x="2.5" y="5" width="15" height="10" rx="1" />
      <circle cx="10" cy="10" r="2.2" />
      <path d="M5 7.5v5M15 7.5v5" />
    </Svg>
  ),
  Note: (p: IconProps) => (
    <Svg {...p}>
      <path d="M4 3.5h12v9l-4 4H4z" />
      <path d="M12 16.5v-4h4M7 7.5h6M7 10.5h4" />
    </Svg>
  ),
  Clock: (p: IconProps) => (
    <Svg {...p}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l2.8 1.8" />
    </Svg>
  ),
  Phone: (p: IconProps) => (
    <Svg {...p}>
      <path d="M5.5 2.5h3l1.5 4-2 1.3a9 9 0 0 0 4.2 4.2l1.3-2 4 1.5v3A1.5 1.5 0 0 1 16 16C8.8 16 4 11.2 4 4a1.5 1.5 0 0 1 1.5-1.5z" />
    </Svg>
  ),
  Mail: (p: IconProps) => (
    <Svg {...p}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="1" />
      <path d="m3 5 7 6 7-6" />
    </Svg>
  ),
  Pin: (p: IconProps) => (
    <Svg {...p}>
      <path d="M10 17.5s5.5-5 5.5-9.3a5.5 5.5 0 0 0-11 0c0 4.3 5.5 9.3 5.5 9.3z" />
      <circle cx="10" cy="8.3" r="2" />
    </Svg>
  ),
  Import: (p: IconProps) => (
    <Svg {...p}>
      <path d="M3.5 6.5V3.5h13v3M3.5 13.5v3h13v-3" />
      <path d="M10 5.5v9M6.5 11l3.5 3.5 3.5-3.5" />
    </Svg>
  ),
  Eye: (p: IconProps) => (
    <Svg {...p}>
      <path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10z" />
      <circle cx="10" cy="10" r="2.5" />
    </Svg>
  ),
};
