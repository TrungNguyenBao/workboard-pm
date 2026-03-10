import { useEffect, useRef } from 'react'
import { useTheme } from '@/shared/hooks/use-theme'

interface Props {
  guideFile: string
  sectionHash: string
}

export function GuideContentFrame({ guideFile, sectionHash }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { theme } = useTheme()

  const themeSuffix = theme === 'dark' ? '?theme=dark' : '?theme=light'
  const src = `/guides-static/${guideFile}${themeSuffix}${sectionHash ? `#${sectionHash}` : ''}`

  // When only hash changes (same file), update src directly to scroll iframe
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !iframe.contentWindow) return
    if (sectionHash) {
      try {
        iframe.contentWindow.location.hash = sectionHash
      } catch {
        // cross-origin fallback — update full src
        iframe.src = src
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionHash])

  return (
    <iframe
      ref={iframeRef}
      key={guideFile}
      src={src}
      title="Guide content"
      className="flex-1 w-full border-0 min-h-0"
      style={{ height: '100%' }}
      sandbox="allow-same-origin allow-scripts"
    />
  )
}
