import { useState } from 'react'
import { usePersons } from '../hooks/usePersons'
import { EXAMPLE_PERSONS } from '../constants'
import { showToast } from '../components/Toast'

export default function PeoplePage() {
  const { persons, loading, addPerson, deletePerson, toggleActive } =
    usePersons()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')

  const handleAdd = async () => {
    if (!newName.trim()) return
    await addPerson(newName.trim())
    setNewName('')
    setShowAddForm(false)
    showToast(`已添加「${newName.trim()}」`)
  }

  const handleQuickAdd = async () => {
    for (const name of EXAMPLE_PERSONS) {
      const exists = persons.some((p) => p.name === name)
      if (!exists) {
        await addPerson(name)
      }
    }
    showToast('已添加示例人员')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-700">👥 人员管理</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary text-sm py-2 px-4"
        >
          ＋ 添加
        </button>
      </div>

      {/* 添加表单 */}
      {showAddForm && (
        <div className="card space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="输入姓名..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="flex-1 btn-primary text-sm py-2 text-center"
            >
              确认添加
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="btn-secondary text-sm py-2"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 人员列表 */}
      {persons.length === 0 ? (
        <div className="card text-center py-8">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-sm text-slate-400">暂无人员</p>
          <p className="text-xs text-slate-400 mt-1">
            添加人员后即可开始排班
          </p>
          <button
            onClick={handleQuickAdd}
            className="mt-3 text-sm text-primary-600 font-medium"
          >
            快速添加示例人员
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {persons.map((person) => (
            <div key={person.id} className="card flex items-center gap-3 py-3">
              {/* 头像 */}
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: person.color }}
              >
                {person.avatar || person.name.charAt(0)}
              </span>

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">
                  {person.name}
                </p>
                <p className="text-xs text-slate-400">
                  排班记录中 · {person.isActive ? '活跃' : '已隐藏'}
                </p>
              </div>

              {/* 操作 */}
              <div className="flex gap-1">
                <button
                  onClick={() => toggleActive(person.id)}
                  className={`px-3 py-1 text-xs rounded-full ${
                    person.isActive
                      ? 'bg-green-50 text-green-600'
                      : 'bg-gray-100 text-slate-400'
                  }`}
                >
                  {person.isActive ? '活跃' : '隐藏'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`确定删除「${person.name}」？\n其排班记录也会被删除。`)) {
                      deletePerson(person.id)
                      showToast(`已删除「${person.name}」`)
                    }
                  }}
                  className="px-3 py-1 text-xs rounded-full bg-red-50 text-red-400"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
