interface SystemRowProps {
  name: string
  status: 'operational' | 'degraded' | 'down'
  optional?: boolean
}

const STATUS_META = {
  operational: {
    label: 'Operational',
    dotClass: 'bg-green-500',
    textClass: 'text-green-400',
  },
  degraded: {
    label: 'Degraded',
    dotClass: 'bg-yellow-500',
    textClass: 'text-yellow-400',
  },
  down: {
    label: 'Down',
    dotClass: 'bg-red-500',
    textClass: 'text-red-400',
  },
}

export function SystemRow({ name, status, optional }: SystemRowProps) {
  const meta = STATUS_META[status]

  return (
    <li className="flex items-center justify-between h-14 min-h-14 px-4 rounded-lg border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium text-slate-200 truncate">{name}</span>
        {optional && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400">
            optional
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`h-2 w-2 rounded-full ${meta.dotClass} animate-pulse`} />
        <span className={`text-sm font-medium ${meta.textClass}`}>{meta.label}</span>
      </div>
    </li>
  )
}

