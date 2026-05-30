/**
 * 颜色工具函数
 */

/**
 * 根据人员姓名生成固定颜色
 */
export function getPersonColor(name) {
  const colors = [
    '#4F46E5', // 靛蓝
    '#0EA5E9', // 天蓝
    '#8B5CF6', // 紫色
    '#EC4899', // 粉色
    '#F59E0B', // 琥珀
    '#14B8A6', // 青绿
    '#F97316', // 橙色
    '#06B6D4', // 青色
    '#84CC16', // 草绿
    '#EAB308', // 黄色
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/**
 * 十六进制颜色转 rgba
 */
export function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * 判断颜色是否偏亮（用于决定文字颜色）
 */
export function isLightColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 180
}
