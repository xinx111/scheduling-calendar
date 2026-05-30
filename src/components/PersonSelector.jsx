/**
 * 人员选择器（横向滚动）
 * @param {Array} persons - 人员列表
 * @param {string} selectedId - 当前选中人员 ID
 * @param {Function} onSelect - 选择回调
 */
export default function PersonSelector({ persons, selectedId, onSelect }) {
  if (!persons || persons.length === 0) {
    return (
      <div className="text-center py-4 text-slate-400 text-sm">
        暂无人员，请先在「人员」页面添加
      </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto py-2 px-1 no-select scrollbar-hide">
      {persons.map((person) => {
        const isSelected = person.id === selectedId
        return (
          <button
            key={person.id}
            onClick={() => onSelect(person.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap
              transition-all duration-150 active:scale-95
              ${
                isSelected
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                  : 'bg-white text-slate-600 border border-gray-200 hover:border-primary-300'
              }
            `}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : person.color,
                color: isSelected ? 'white' : 'white',
              }}
            >
              {person.avatar || person.name.charAt(0)}
            </span>
            <span className="font-medium text-sm">{person.name}</span>
          </button>
        )
      })}
    </div>
  )
}
