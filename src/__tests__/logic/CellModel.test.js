import { describe, it, expect } from 'vitest'
import { createCell, cloneCell, EMPTY } from '../../logic/CellModel.js'

describe('createCell', () => {
  it('defaults to empty with no given flag', () => {
    const cell = createCell()
    expect(cell.value).toBe(EMPTY)
    expect(cell.isGiven).toBe(false)
    expect(cell.notes).toBe(0)
    expect(cell.isError).toBe(false)
  })

  it('stores the provided digit', () => {
    const cell = createCell(7, true)
    expect(cell.value).toBe(7)
    expect(cell.isGiven).toBe(true)
  })

  it('does not share references between calls', () => {
    const a = createCell(1, true)
    const b = createCell(2, false)
    expect(a).not.toBe(b)
  })
})

describe('cloneCell', () => {
  it('produces an equal but distinct object', () => {
    const original = createCell(5, true)
    const clone = cloneCell(original)
    expect(clone).toEqual(original)
    expect(clone).not.toBe(original)
  })

  it('mutations to clone do not affect original', () => {
    const original = createCell(3, false)
    const clone = cloneCell(original)
    clone.value = 9
    expect(original.value).toBe(3)
  })
})
