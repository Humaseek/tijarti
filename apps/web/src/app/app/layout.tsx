import { DeviceFrame } from "@/components/shell/device-frame";

/**
 * Shell layout — wraps all /app/* pages in the iPhone device frame.
 * This is the entry into the actual Tijarti app surface.
 */
export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return <DeviceFrame>{children}</DeviceFrame>;
}
