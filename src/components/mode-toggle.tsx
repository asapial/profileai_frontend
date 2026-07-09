"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

/**
 * Cycle light → dark → system → light.
 * Used when the toggle is rendered in tight spaces (e.g. sidebar footer)
 * where a dropdown would feel heavy.
 */
function ModeToggleIcon({
  className,
  variant = "outline",
  size = "icon",
}: {
  className?: string
  variant?: "outline" | "ghost" | "secondary"
  size?: "icon" | "sm" | "default"
}) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  // `next-themes` returns `undefined` until the client has read the persisted
  // choice; the canonical way to gate the icon swap on that is to flip a
  // `mounted` flag after the first client render. The lint rule above flags
  // `setState` inside `useEffect`; we suppress it because this is exactly
  // the SSR-safety pattern documented by `next-themes`.
  const [mounted, setMounted] = React.useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), [])

  const cycle = () => {
    // resolvedTheme reflects what the user actually sees right now (system
    // collapses to the active scheme). We cycle against the *displayed*
    // value so the click feels predictable.
    const current = theme === "system" ? resolvedTheme : theme
    setTheme(current === "dark" ? "light" : "dark")
  }

  const isDark =
    mounted && (theme === "system" ? resolvedTheme === "dark" : theme === "dark")

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={cycle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={cn(
        "relative text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Sun
        className={cn(
          "h-4 w-4 transition-all",
          isDark ? "rotate-90 scale-0" : "rotate-0 scale-100",
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all",
          isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0",
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

/**
 * Full dropdown with light / dark / system options. Used in the top
 * navbar where there's room for a labelled menu.
 */
export function ModeToggle({ className }: { className?: string }) {
  const { setTheme, theme } = useTheme()
  // SSR safety: don't read the persisted theme until we're mounted on the
  // client. See the note on `ModeToggleIcon` above for why we keep the
  // effect and disable the lint rule locally.
  const [mounted, setMounted] = React.useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Toggle theme"
          className={cn(
            "relative rounded-lg border-border/60 text-muted-foreground hover:text-foreground",
            className,
          )}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-lg">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="gap-2"
          data-active={mounted && theme === "light"}
        >
          <Sun className="h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="gap-2"
          data-active={mounted && theme === "dark"}
        >
          <Moon className="h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="gap-2"
          data-active={mounted && theme === "system"}
        >
          <Monitor className="h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Compact two-state toggle (no dropdown). Drop this into the sidebar
 * footer where there's no room for the labelled menu.
 */
export function ModeToggleCompact({ className }: { className?: string }) {
  return <ModeToggleIcon variant="outline" size="icon" className={className} />
}

export { ModeToggleIcon }
