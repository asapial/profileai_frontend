import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Keep the first client render identical to the server render. Reading
  // window.innerWidth in the state initializer made the mobile sidebar render
  // a Sheet while SSR had rendered the desktop sidebar, forcing React to
  // discard and regenerate the entire dashboard tree during hydration.
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
