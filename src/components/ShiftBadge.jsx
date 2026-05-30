import { isLightColor } from '../utils/color'

/**
 * 班次标签组件
 * @param {Object} shift - 班次模板对象
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} showTime - 是否显示时间
 */
export default function ShiftBadge({ shift, size = 'md', showTime = false }) {
  if (!shift) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-400">
        未排班
      </span>
    )
  }

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-0.5',
    md: 'text-sm px-3 py-1 gap-1',
    lg: 'text-base px-4 py-1.5 gap-1.5',
  }

  const textColor = isLightColor(shift.color) ? 'text-gray-800' : 'text-white'

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeStyles[size]} ${textColor}`}
      style={{ backgroundColor: shift.color }}
    >
      <span>{shift.icon}</span>
      <span>{shift.shortName || shift.name}</span>
      {showTime && shift.startTime && (
        <span className="opacity-80 text-xs ml-1">
          {shift.startTime}-{shift.endTime}
        </span>
      )}
    </span>
  )
}
