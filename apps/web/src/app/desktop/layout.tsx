import { DesktopShell } from "@/components/shell/desktop-shell";

/**
 * Desktop layout — wraps all /desktop/* pages in the sidebar + header shell.
 * Uses the same store/data as the mobile app at /app — only the chrome differs.
 */
export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return <DesktopShell>{children}</DesktopShell>;
}
