import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { compressImage } from '../utils/compress'
import { showToast } from '../components/Toast'
import { addPerson, getActivePersons } from '../db/personStore'
import { getAllShifts } from '../db/shiftStore'
import { addScheduleRecords } from '../db/scheduleStore'
import { saveSchedule } from '../db/scheduleWeekStore'

/**
 * AI 识别 prompt
 */
const RECOGNITION_PROMPT = `你是一名排班表识别助手。请分析这张手写排班图片，提取出排班信息。

图片中的表格结构通常是：
- 行：人员姓名（左侧）
- 列：日期（周一至周日）

请按以下 JSON 格式返回，不要输出任何其他内容：

{
  "persons": ["张三", "李四"],
  "shifts": [
    { "person": "张三", "date": "2026-05-25", "shiftName": "早班" },
    ...
  ]
}

班次名称规范：早班、中班、晚班、通班、休息
如果无法确定具体名称，请用最接近的。日期格式必须是 YYYY-MM-DD。
如果图片不是排班表，请返回 { "error": "无法识别为排班表" }`

export default function UploadPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [image, setImage] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [recognizing, setRecognizing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setResult(null)

    // 显示预览
    const reader = new FileReader()
    reader.onload = (ev) => setImage(ev.target.result)
    reader.onerror = () => {
      showToast('图片读取失败，请重试', 'error')
    }
    reader.readAsDataURL(file)

    // 压缩图片
    try {
      const compressed = await compressImage(file)
      setImageBase64(compressed)
    } catch (err) {
      showToast('图片压缩失败', 'error')
    }
  }

  const handleRecognize = async () => {
    if (!imageBase64) {
      showToast('请先选择图片', 'warning')
      return
    }

    setRecognizing(true)
    setError(null)

    try {
      const apiKey = import.meta.env.VITE_ZHIPU_API_KEY
      if (!apiKey) {
        throw new Error('未配置 API Key，请在项目 .env 文件中设置 VITE_ZHIPU_API_KEY')
      }

      // 调用智谱 API
      const response = await fetch(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'glm-4v-flash',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'image_url', image_url: { url: imageBase64 } },
                  { type: 'text', text: RECOGNITION_PROMPT },
                ],
              },
            ],
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      // 解析 JSON
      let parsed
      try {
        // 提取 JSON（AI 可能在大段文字中包含 JSON）
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('AI 返回格式异常')
        parsed = JSON.parse(jsonMatch[0])
      } catch {
        throw new Error('无法解析 AI 返回结果，请重试')
      }

      if (parsed.error) {
        throw new Error(parsed.error)
      }

      setResult(parsed)
      showToast(`识别成功！共 ${parsed.persons?.length || 0} 人`)
    } catch (err) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setRecognizing(false)
    }
  }

  const handleConfirmAndSave = async () => {
    if (!result) return

    try {
      const shifts = await getAllShifts()

      // 建立班次名称 → ID 映射
      const shiftMap = {}
      for (const s of shifts) {
        shiftMap[s.name] = s.id
        shiftMap[s.shortName] = s.id
      }

      // 获取已有人员
      const existingPersons = await getActivePersons()
      const personNameMap = {}
      for (const p of existingPersons) {
        personNameMap[p.name] = p.id
      }

      // 创建新人员
      for (const name of result.persons || []) {
        if (!personNameMap[name]) {
          const p = await addPerson(name)
          personNameMap[name] = p.id
        }
      }

      // 构建排班记录
      const records = []
      for (const shift of result.shifts || []) {
        const personId = personNameMap[shift.person]
        const shiftId = shiftMap[shift.shiftName] || 'shift-off'

        if (personId) {
          records.push({
            personId,
            date: shift.date,
            shiftId,
            source: 'ai',
          })
        }
      }

      // 保存排班记录
      await addScheduleRecords(records)

      // 保存周批次
      const shiftsArray = result.shifts || []
      const dates = shiftsArray.map((s) => s.date).filter(Boolean)
      if (dates.length > 0) {
        dates.sort()
        const weekStart = dates[0]
        const weekEnd = dates[dates.length - 1]
        await saveSchedule({ weekStart, weekEnd })
      }

      showToast(`排班已保存！共 ${records.length} 条记录`)
      navigate('/')
    } catch (err) {
      showToast(`保存失败: ${err.message}`, 'error')
    }
  }

  const handleCancel = () => {
    setImage(null)
    setImageBase64(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-700">📷 拍照识别</h2>

      {/* 图片选择 */}
      <div
        className="card relative min-h-[200px] flex flex-col items-center justify-center cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {image ? (
          <img
            src={image}
            alt="排班表预览"
            className="max-w-full max-h-[300px] rounded-xl object-contain"
          />
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📸</div>
            <p className="text-sm text-slate-500">点击选择排班表图片</p>
            <p className="text-xs text-slate-400 mt-1">
              支持拍照或从相册选择
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 操作按钮 */}
      {image && !result && (
        <div className="flex gap-3">
          <button
            onClick={handleRecognize}
            disabled={recognizing}
            className="flex-1 btn-primary text-center flex items-center justify-center gap-2"
          >
            {recognizing ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                识别中...
              </>
            ) : (
              '🤖 AI 识别排班'
            )}
          </button>
          <button onClick={handleCancel} className="btn-secondary">
            重新选择
          </button>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="card bg-red-50 border-red-100">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={handleRecognize}
            className="mt-2 text-sm text-red-700 underline active:text-red-800"
          >
            重试
          </button>
        </div>
      )}

      {/* 识别结果 */}
      {result && (
        <div className="card">
          <h3 className="text-sm font-bold text-slate-600 mb-3">
            ✅ 识别结果
          </h3>

          {/* 人员列表 */}
          <div className="mb-3">
            <span className="text-xs text-slate-400">识别到人员：</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {result.persons?.map((name) => (
                <span
                  key={name}
                  className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded-full"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* 排班表格预览 */}
          <div className="max-h-48 overflow-y-auto mb-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-gray-100">
                  <th className="text-left py-1 pr-2">姓名</th>
                  <th className="text-left py-1 pr-2">日期</th>
                  <th className="text-left py-1">班次</th>
                </tr>
              </thead>
              <tbody>
                {result.shifts?.map((s, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-1 pr-2 font-medium">{s.person}</td>
                    <td className="py-1 pr-2 text-slate-500">{s.date}</td>
                    <td className="py-1">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100">
                        {s.shiftName}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            共 {(result.shifts || []).length} 条排班记录
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleConfirmAndSave}
              className="flex-1 btn-primary text-sm py-2.5 text-center"
            >
              ✓ 确认保存
            </button>
            <button onClick={handleCancel} className="btn-secondary text-sm py-2.5">
              ✏️ 重新识别
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
