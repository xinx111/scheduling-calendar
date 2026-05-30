export default function PersonSelector({ persons, selectedId, onSelect }) {
  if (!persons || persons.length === 0) {
    return (
      <div className="text-center py-5 text-slate-400 text-sm bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
        <span className="text-lg">👥</span>
        <p className="mt-1">暂无人员，请先在「人员」页面添加</p>
      </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto py-2 px-0.5 no-select scrollbar-hide -mx-0.5">
      {persons.map((person) => {
        const isSelected = person.id === selectedId
        return (
          <button
            key={person.id}
            onClick={() => onSelect(person.id)}
            className={`
              flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap
              transition-all duration-200 active:scale-95 flex-shrink-0
              ${
                isSelected
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-200/50'
                  : 'bg-white/90 text-slate-600 border border-gray-200/80 hover:border-primary-300/60 hover:bg-primary-50/30 shadow-sm'
              }
            `}
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden"
              style={{
                backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : person.color,
                color: isSelected ? 'white' : 'white',
                textShadow: isSelected ? 'none' : '0 1px 1px rgba(0,0,0,0.1)',
              }}
            >
              {person.avatar || person.name.charAt(0)}
            </span>
            <span className="font-medium text-[13px]">{person.name}</span>
          </button>
        )
      })}
    </div>
  )
}
