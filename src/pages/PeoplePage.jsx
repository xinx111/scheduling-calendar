import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
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
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-3.5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">👥</span>
          <h2 className="text-lg font-bold text-slate-700">人员管理</h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary text-sm py-2 px-4 shadow-lg shadow-primary-200/30"
        >
          ＋ 添加
        </button>
      </div>

      {/* 添加表单 */}
      {showAddForm && (
        <div className="card animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">📝</span>
            <h3 className="text-sm font-semibold text-slate-700">添加新人员</h3>
          </div>
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="输入姓名..." className="input-field" autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} disabled={!newName.trim()}
              className="flex-1 btn-primary text-sm py-2.5 text-center disabled:opacity-50">确认添加</button>
            <button onClick={() => setShowAddForm(false)}
              className="btn-secondary text-sm py-2.5 flex-1 text-center">取消</button>
          </div>
        </div>
      )}

      {/* 人员列表 */}
      {persons.length === 0 ? (
        <div className="card text-center py-10">
          <span className="text-4xl block mb-3">📋</span>
          <p className="text-sm text-slate-400 font-medium">暂无人员</p>
          <p className="text-xs text-slate-400 mt-1">添加人员后即可开始排班</p>
          <button onClick={handleQuickAdd}
            className="mt-4 text-sm font-semibold text-primary-600 px-5 py-2.5 rounded-xl bg-primary-50 active:bg-primary-100 transition-colors">
            快速添加示例人员 →
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {persons.map((person) => (
            <div key={person.id} className="card flex items-center gap-3 py-3.5">
              {/* 头像 + 信息 */}
              <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => navigate(`/person/${person.id}`)}>
                <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm flex-shrink-0"
                  style={{ backgroundColor: person.color }}>
                  {person.avatar || person.name.charAt(0)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700">{person.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${person.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                    {person.isActive ? '活跃中' : '已隐藏'}
                    <span className="text-primary-400 ml-auto">查看详情 →</span>
                  </p>
                </div>
              </div>

              {/* 操作 */}
              <div className="flex gap-1.5">
                <button onClick={() => handleEdit(person)}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl bg-primary-50 text-primary-600 active:bg-primary-100 transition-colors">编辑</button>
                <button onClick={() => toggleActive(person.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                    person.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-slate-400'
                  }`}>
                  {person.isActive ? '活跃' : '隐藏'}
                </button>
                <button onClick={() => {
                    if (window.confirm(`确定删除「${person.name}」？排班记录也会被删除。`)) {
                      deletePerson(person.id)
                      showToast(`已删除「${person.name}」`)
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl bg-rose-50 text-rose-400 active:bg-rose-100 transition-colors">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 编辑弹窗 */}
      {editPerson && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setEditPerson(null)}>
          <div className="absolute bottom-14 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col animate-slide-up max-h-[65vh]"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300/60" />
            </div>
            <div className="flex-shrink-0 border-b border-gray-100 px-5 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-700">✏️ 编辑人员</h3>
                <button onClick={() => setEditPerson(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-slate-400 transition-colors">✕</button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
              <div className="flex flex-col items-center py-2">
                <span className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
                  style={{ backgroundColor: editPerson.color }}>{editAvatar}</span>
                <p className="text-xs text-slate-400 mt-2.5">点击下方选择头像</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">姓名</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" autoFocus />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-2 block">头像图标</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button key={emoji} onClick={() => setEditAvatar(emoji)}
                      className={`w-full aspect-square rounded-xl flex items-center justify-center text-lg transition-all ${
                        editAvatar === emoji ? 'bg-primary-100 ring-2 ring-primary-500 scale-105 shadow-sm' : 'bg-gray-50 hover:bg-gray-100'
                      }`}>{emoji}</button>
                  ))}
                </div>
                <button onClick={() => setEditAvatar(editPerson.name.charAt(0))}
                  className={`mt-2.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    editAvatar === editPerson.name.charAt(0)
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-gray-100 text-slate-500'
                  }`}>
                  使用首字「{editPerson.name.charAt(0)}」
                </button>
              </div>
            </div>
            <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4">
              <div className="flex gap-3">
                <button onClick={handleSaveEdit} disabled={!editName.trim()}
                  className="flex-1 btn-primary text-sm py-3 text-center disabled:opacity-50 shadow-lg shadow-primary-200/30">✓ 保存</button>
                <button onClick={() => setEditPerson(null)}
                  className="btn-secondary text-sm py-3 flex-1 text-center">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
