import { useEffect } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'

type Props = {
  onClose: () => void
}

type HelpItem = { term: string; desc: string }

const DESKTOP: HelpItem[] = [
  {
    term: 'Add a shape',
    desc: 'Click + Add Shape, pick a type and enter its dimensions.',
  },
  {
    term: 'Edit',
    desc: 'Double-click a shape, or select one and click Edit, to change its dimensions.',
  },
  {
    term: 'Select',
    desc: 'Click a shape. Ctrl/⌘-click to add or remove others, or drag a box across empty space to select everything inside it.',
  },
  {
    term: 'Move',
    desc: 'Drag the area label in the middle of a shape. Arrow keys nudge the selection; Delete removes it.',
  },
  {
    term: 'Make a room',
    desc: 'Select two or more shapes and choose Combine into Room. Select a room and choose Disband to split it back into shapes.',
  },
  {
    term: 'Get around',
    desc: 'Right-click, middle-click, or hold Space and drag to pan. Scroll to zoom.',
  },
  {
    term: 'Measure',
    desc: 'Toggle the ruler tool to read live distances from your cursor to the walls.',
  },
]

const MOBILE: HelpItem[] = [
  {
    term: 'Add a shape',
    desc: 'Tap +, pick a type and enter its dimensions.',
  },
  {
    term: 'Edit',
    desc: 'Select a single shape, then tap Edit in the bottom bar to change its dimensions.',
  },
  {
    term: 'Select',
    desc: 'Long-press a shape to start selection mode, then tap shapes and rooms to add or remove them.',
  },
  {
    term: 'Move',
    desc: 'Drag the area label in the middle of a shape.',
  },
  {
    term: 'Make a room',
    desc: 'Select two or more shapes, then tap Combine in the bottom bar. Tap Disband to split a room back into shapes, or Cancel to leave selection mode.',
  },
  {
    term: 'Get around',
    desc: 'Drag one finger on empty space to pan. Use two fingers to pan, and pinch to zoom.',
  },
  {
    term: 'Measure',
    desc: 'Toggle the ruler tool to read live distances to the walls.',
  },
]

export function HelpModal({ onClose }: Props) {
  const isMobile = useIsMobile()
  const items = isMobile ? MOBILE : DESKTOP

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel modal__panel--wide">
        <h2 className="modal__title">How to use Groundwork</h2>
        <dl className="help-list">
          {items.map((item) => (
            <div key={item.term} className="help-item">
              <dt className="help-item__term">{item.term}</dt>
              <dd className="help-item__desc">{item.desc}</dd>
            </div>
          ))}
        </dl>
        <div className="modal__actions">
          <button type="button" className="toolbar__btn primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
