import { useState, useCallback } from 'react'

const KEY = 'sudoku_records'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? {} }
  catch { return {} }
}

export function useRecords() {
  const [records, setRecords] = useState(load)

  // Submits a completed game result. Updates localStorage and returns
  // flags indicating which records were broken plus the updated values.
  const submitResult = useCallback((difficulty, time, score) => {
    const current = records[difficulty] ?? {}
    const isNewBestTime  = current.bestTime  == null || time  < current.bestTime
    const isNewHighScore = current.highScore == null || score > current.highScore

    const updated = {
      ...records,
      [difficulty]: {
        bestTime:  isNewBestTime  ? time  : current.bestTime,
        highScore: isNewHighScore ? score : current.highScore,
      },
    }
    try { localStorage.setItem(KEY, JSON.stringify(updated)) } catch {}
    setRecords(updated)

    return {
      isNewBestTime,
      isNewHighScore,
      bestTime:  updated[difficulty].bestTime,
      highScore: updated[difficulty].highScore,
    }
  }, [records])

  return { records, submitResult }
}
