import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { matchesCombo, useTabArrowNav } from './useKeyBinding'

function makeEvent(key: string, mods: Partial<{ ctrlKey: boolean; metaKey: boolean }> = {}): KeyboardEvent {
  return { key, ctrlKey: false, metaKey: false, ...mods } as KeyboardEvent
}

describe('matchesCombo', () => {
  it('matches a plain key with no modifiers', () => {
    expect(matchesCombo(makeEvent('s'), 's')).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(matchesCombo(makeEvent('S'), 's')).toBe(true)
  })

  it('matches a symbol key directly', () => {
    expect(matchesCombo(makeEvent('?'), '?')).toBe(true)
  })

  it('matches arrow keys', () => {
    expect(matchesCombo(makeEvent('ArrowLeft'), 'ArrowLeft')).toBe(true)
  })

  it('rejects a plain key combo when ctrl is held', () => {
    expect(matchesCombo(makeEvent('s', { ctrlKey: true }), 's')).toBe(false)
  })

  it('matches mod+key with ctrlKey', () => {
    expect(matchesCombo(makeEvent('k', { ctrlKey: true }), 'mod+k')).toBe(true)
  })

  it('matches mod+key with metaKey', () => {
    expect(matchesCombo(makeEvent('k', { metaKey: true }), 'mod+k')).toBe(true)
  })

  it('rejects mod+key when no modifier is held', () => {
    expect(matchesCombo(makeEvent('k'), 'mod+k')).toBe(false)
  })

  it('rejects when key does not match', () => {
    expect(matchesCombo(makeEvent('a'), 's')).toBe(false)
  })
})

describe('useTabArrowNav', () => {
  const tabs = ['a', 'b', 'c'] as const

  it('moves to the next tab on ArrowRight', () => {
    const setActiveTab = vi.fn()
    renderHook(() => useTabArrowNav([...tabs], 'a', setActiveTab))
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(setActiveTab).toHaveBeenCalledWith('b')
  })

  it('moves to the previous tab on ArrowLeft', () => {
    const setActiveTab = vi.fn()
    renderHook(() => useTabArrowNav([...tabs], 'b', setActiveTab))
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(setActiveTab).toHaveBeenCalledWith('a')
  })

  it('does not go past the last tab on ArrowRight', () => {
    const setActiveTab = vi.fn()
    renderHook(() => useTabArrowNav([...tabs], 'c', setActiveTab))
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(setActiveTab).not.toHaveBeenCalled()
  })

  it('does not go before the first tab on ArrowLeft', () => {
    const setActiveTab = vi.fn()
    renderHook(() => useTabArrowNav([...tabs], 'a', setActiveTab))
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(setActiveTab).not.toHaveBeenCalled()
  })
})
