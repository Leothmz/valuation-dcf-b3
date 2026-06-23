import { useEffect } from 'react'

type KeyHandler = (e: KeyboardEvent) => void

export interface KeyBindingOptions {
  enabled?: boolean
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

// "mod" matches Ctrl (Windows/Linux) or Cmd (Mac). Symbol keys like "?" are matched
// directly against e.key, which already reflects shift-produced characters.
export function matchesCombo(e: KeyboardEvent, combo: string): boolean {
  const parts = combo.split('+').map((p) => p.trim().toLowerCase())
  const key = parts[parts.length - 1]
  const wantMod = parts.includes('mod')
  if (wantMod !== (e.ctrlKey || e.metaKey)) return false
  return e.key.toLowerCase() === key
}

// Registers global key shortcuts. Ignored while focus is inside an input/textarea/select/contenteditable.
export function useKeyBinding(bindings: Record<string, KeyHandler>, options: KeyBindingOptions = {}) {
  const { enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return
      for (const [combo, handler] of Object.entries(bindings)) {
        if (matchesCombo(e, combo)) {
          handler(e)
          return
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [bindings, enabled])
}

// Closes a modal on Escape — only registers the listener while the modal is open.
export function useEscapeToClose(isOpen: boolean, onClose: () => void) {
  useKeyBinding({ Escape: onClose }, { enabled: isOpen })
}

// Cycles through a tab list with ArrowLeft/ArrowRight.
export function useTabArrowNav<T extends string>(tabs: T[], activeTab: T, setActiveTab: (id: T) => void) {
  useKeyBinding({
    ArrowLeft: () => {
      const idx = tabs.indexOf(activeTab)
      if (idx > 0) setActiveTab(tabs[idx - 1])
    },
    ArrowRight: () => {
      const idx = tabs.indexOf(activeTab)
      if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1])
    },
  })
}
