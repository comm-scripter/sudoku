import { describe, it, expect } from 'vitest'
import {
  hasNote, addNote, removeNote, toggleNote,
  getNotes, notesFromSet, countNotes, EMPTY_NOTES,
} from '../../logic/NotesModel.js'

describe('hasNote', () => {
  it('returns false for empty mask', () => {
    expect(hasNote(EMPTY_NOTES, 5)).toBe(false)
  })

  it('returns true after addNote', () => {
    expect(hasNote(addNote(0, 5), 5)).toBe(true)
  })

  it('returns false after removeNote', () => {
    const mask = removeNote(addNote(0, 3), 3)
    expect(hasNote(mask, 3)).toBe(false)
  })
})

describe('toggleNote', () => {
  it('adds a digit when absent', () => {
    expect(hasNote(toggleNote(0, 7), 7)).toBe(true)
  })

  it('removes a digit when present', () => {
    const mask = toggleNote(toggleNote(0, 7), 7)
    expect(hasNote(mask, 7)).toBe(false)
  })
})

describe('getNotes', () => {
  it('returns [] for mask 0', () => {
    expect(getNotes(0)).toEqual([])
  })

  it('returns digits in order 1–9', () => {
    const mask = notesFromSet([3, 7, 1])
    expect(getNotes(mask)).toEqual([1, 3, 7])
  })

  it('returns all 9 digits for a full mask', () => {
    const full = notesFromSet([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(getNotes(full)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})

describe('countNotes', () => {
  it('counts zero bits in empty mask', () => {
    expect(countNotes(0)).toBe(0)
  })

  it('counts bits correctly', () => {
    expect(countNotes(notesFromSet([1, 5, 9]))).toBe(3)
  })
})
