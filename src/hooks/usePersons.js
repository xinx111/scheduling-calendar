import { useState, useEffect, useCallback } from 'react'
import * as personStore from '../db/personStore'
import { showToast } from '../components/Toast'

/**
 * 人员数据 Hook
 */
export function usePersons() {
  const [persons, setPersons] = useState([])
  const [activePersons, setActivePersons] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [all, active] = await Promise.all([
        personStore.getAllPersons(),
        personStore.getActivePersons(),
      ])
      setPersons(all)
      setActivePersons(active)
    } catch (err) {
      console.error('加载人员数据失败:', err)
      showToast('数据库加载失败: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addPerson = useCallback(async (name, options) => {
    const person = await personStore.addPerson(name, options)
    await load()
    return person
  }, [load])

  const addPersons = useCallback(async (names) => {
    const persons = await personStore.addPersons(names)
    await load()
    return persons
  }, [load])

  const updatePerson = useCallback(async (id, updates) => {
    const person = await personStore.updatePerson(id, updates)
    await load()
    return person
  }, [load])

  const deletePerson = useCallback(async (id) => {
    await personStore.deletePerson(id)
    await load()
  }, [load])

  const toggleActive = useCallback(async (id) => {
    const person = await personStore.togglePersonActive(id)
    await load()
    return person
  }, [load])

  return {
    persons,
    activePersons,
    loading,
    addPerson,
    updatePerson,
    deletePerson,
    toggleActive,
    refresh: load,
  }
}

/**
 * 单个人员 Hook
 */
export function usePerson(id) {
  const [person, setPerson] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    setLoading(true)
    personStore.getPerson(id).then((p) => {
      setPerson(p)
      setLoading(false)
    }).catch((err) => {
      console.error('加载人员失败:', err)
      setLoading(false)
    })
  }, [id])

  return { person, loading }
}
