'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type NodeType = 'assetClass' | 'instrument' | 'provider' | 'asset'

interface TreeNodeProps {
  id: string
  type: NodeType
  name: string
  level: number
  isExpanded?: boolean
  onToggle?: () => void
  onEdit: () => void
  onAdd?: () => void
  hasChildren?: boolean
  children?: React.ReactNode
  badge?: string
  subtitle?: string
}

const levelColors: Record<number, string> = {
  0: 'border-l-accent',
  1: 'border-l-success',
  2: 'border-l-yellow-400',
  3: 'border-l-rose-400',
}

const levelIcons: Record<NodeType, React.ReactNode> = {
  assetClass: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  ),
  instrument: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  ),
  provider: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  ),
  asset: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export function TreeNode({
  id,
  type,
  name,
  level,
  isExpanded,
  onToggle,
  onEdit,
  onAdd,
  hasChildren,
  children,
  badge,
  subtitle,
}: TreeNodeProps) {
  const [isHovered, setIsHovered] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { type, level },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const paddingLeft = level * 16 + 8

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
      <div
        className={`flex items-center gap-2 py-2.5 px-3 rounded-xl transition-colors border-r-2 ${levelColors[level]} ${
          isHovered ? 'bg-white/5' : ''
        }`}
        style={{ paddingRight: paddingLeft }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 -m-1 text-white/30 hover:text-white/60 cursor-grab active:cursor-grabbing touch-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
        </button>

        {/* Expand/collapse */}
        {hasChildren ? (
          <button onClick={onToggle} className="p-1 -m-1 text-white/50 hover:text-white transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Icon */}
        <span className="text-white/50">{levelIcons[type]}</span>

        {/* Name */}
        <button onClick={onEdit} className="flex-1 text-start text-white hover:text-accent transition-colors truncate">
          {name}
        </button>

        {/* Badge */}
        {badge && <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{badge}</span>}

        {/* Subtitle */}
        {subtitle && <span className="text-xs text-white/40">{subtitle}</span>}

        {/* Add button (for non-asset nodes) */}
        {onAdd && (
          <button
            onClick={onAdd}
            className={`p-1 -m-1 text-white/30 hover:text-accent transition-colors ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        )}
      </div>

      {/* Children */}
      {isExpanded && children && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  )
}

export default TreeNode
