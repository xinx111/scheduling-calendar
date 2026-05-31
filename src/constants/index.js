/**
 * 默认班次模板（首次启动时自动初始化）
 */
export const DEFAULT_SHIFTS = [
  {
    id: 'shift-morning',
    name: '早班',
    shortName: '早',
    startTime: '08:00',
    endTime: '16:00',
    color: '#F59E0B',
    icon: '☀️',
    isDefault: true,
  },
  {
    id: 'shift-afternoon',
    name: '中班',
    shortName: '中',
    startTime: '12:00',
    endTime: '20:00',
    color: '#3B82F6',
    icon: '🌤️',
    isDefault: true,
  },
  {
    id: 'shift-night',
    name: '晚班',
    shortName: '晚',
    startTime: '16:00',
    endTime: '00:00',
    color: '#6366F1',
    icon: '🌙',
    isDefault: true,
  },
  {
    id: 'shift-full',
    name: '通班',
    shortName: '通',
    startTime: '08:00',
    endTime: '22:00',
    color: '#EF4444',
    icon: '🔄',
    isDefault: true,
  },
  {
    id: 'shift-off',
    name: '休息',
    shortName: '休',
    startTime: null,
    endTime: null,
    color: '#10B981',
    icon: '😴',
    isDefault: true,
  },
]

/**
 * 预置人员示例（可选）
 */
export const EXAMPLE_PERSONS = [
  '张三',
  '李四',
  '王五',
  '赵六',
  '钱七',
]

/**
 * 应用配色
 */
export const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
}

/**
 * 底部导航栏配置
 */
export const NAV_ITEMS = [
  { path: '/', label: '排班', icon: '📅', exact: true },
  { path: '/people', label: '人员', icon: '👥' },
  { path: '/reminders', label: '提醒', icon: '🔔' },
  { path: '/settings', label: '设置', icon: '⚙️' },
]


/**
 * 日期工具
 */
export const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']
export const WEEKDAY_NAMES_FULL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
