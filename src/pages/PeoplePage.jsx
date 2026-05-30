import { useState } from 'react'
import { usePersons } from '../hooks/usePersons'
import { EXAMPLE_PERSONS } from '../constants'
import { showToast } from '../components/Toast'

const AVATAR_OPTIONS = [
  '😀', '😎', '🤩', '😊', '🥰', '😺',
  '🐱', '🐶', '🐼', '🦊', '🐰', '🐸',
  '🌈', '⭐', '🔥', '💪', '🎯', '🎨',
  '👨‍💻', '👩‍💻', '👨‍🔧', '👩‍🔧', '👨‍🏫', '👩‍🏫',
  '👑', '🎸', '🏀', '⚽', '🚀', '🌊',
]

export default function PeoplePage() {
  const { persons, loading, addPerson, deletePerson, toggleActive, updatePerson } =
    usePersons()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')

  // 编辑状态
  const [editPerson, setEditPerson] = useState(null)
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState('')

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

  const handleEdit = (person) => {
    setEditPerson(person)
    setEditName(person.name)
    setEditAvatar(person.avatar || person.name.charAt(0))
  }

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editPerson) return
    try {
      await updatePerson(editPerson.id, {
        name: editName.trim(),
        avatar: editAvatar,
      })
      showToast(`已更新「${editName.trim()}」`)
      setEditPerson(null)
    } catch (err) {
      showToast('更新失败: ' + err.message, 'error')
    }
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
                  onClick={() => handleEdit(person)}
                  className="px-3 py-1 text-xs rounded-full bg-primary-50 text-primary-600"
                >
                  编辑
                </button>
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

      {/* 编辑弹窗 */}
      {editPerson && (
        <div
          className="fixed inset-0 z-[100] flex items-end bg-black/30"
          onClick={() => setEditPerson(null)}
        >
          <div
            className="w-full bg-white rounded-t-2xl shadow-xl flex flex-col"
            style={{ maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题 */}
            <div className="flex-shrink-0 border-b border-gray-100 px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-700">
                  ✏️ 编辑人员
                </h3>
                <button
                  onClick={() => setEditPerson(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-slate-400"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
              {/* 当前头像预览 */}
              <div className="flex flex-col items-center">
                <span
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: editPerson.color }}
                >
                  {editAvatar}
                </span>
                <p className="text-xs text-slate-400 mt-2">点击下方选择头像图标</p>
              </div>

              {/* 姓名 */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  姓名
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                  autoFocus
                />
              </div>

              {/* 头像选择 */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-2 block">
                  选择头像图标
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setEditAvatar(emoji)}
                      className={`w-full aspect-square rounded-xl flex items-center justify-center text-xl transition-all ${
                        editAvatar === emoji
                          ? 'bg-primary-100 ring-2 ring-primary-500 scale-105'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setEditAvatar(editPerson.name.charAt(0))}
                  className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    editAvatar === editPerson.name.charAt(0)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-slate-500'
                  }`}
                >
                  使用文字首字「{editPerson.name.charAt(0)}」
                </button>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4">
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={!editName.trim()}
                  className="flex-1 btn-primary text-sm py-3 text-center disabled:opacity-50"
                >
                  ✓ 保存
                </button>
                <button
                  onClick={() => setEditPerson(null)}
                  className="btn-secondary text-sm py-3 flex-1 text-center"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
