/**
 * 图片压缩工具
 * 在调用智谱 API 前压缩图片，减少传输大小
 */

/**
 * 压缩图片到指定最大宽度
 * @param {File} file - 原始图片文件
 * @param {number} maxWidth - 最大宽度（默认 1024）
 * @param {number} quality - 压缩质量 0-1（默认 0.8）
 * @returns {Promise<string>} base64 字符串
 */
export function compressImage(file, maxWidth = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        const base64 = canvas.toDataURL('image/jpeg', quality)
        resolve(base64)
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 将 base64 图片转为可直接传入智谱 API 的格式
 * 智谱 API 支持直接传入 base64（不含 data:image/... 前缀也可）
 */
export function prepareImageForAPI(base64) {
  // 如果已经包含 data:image 前缀，直接返回
  if (base64.startsWith('data:')) {
    return base64
  }
  // 否则添加前缀
  return `data:image/jpeg;base64,${base64}`
}
