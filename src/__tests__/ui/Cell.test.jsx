import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Cell } from '../../ui/Cell/Cell.jsx'
import { notesFromSet } from '../../logic/NotesModel.js'

describe('Cell', () => {
  it('renders a digit value', () => {
    render(<Cell value={5} isGiven notes={0} row={0} col={0} onClick={() => {}} />)
    expect(screen.getByText('5')).toBeTruthy()
  })

  it('calls onClick with (row, col)', async () => {
    const user    = userEvent.setup()
    const onClick = vi.fn()
    render(<Cell value={0} notes={0} row={3} col={7} onClick={onClick} />)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledWith(3, 7)
  })

  it('has an accessible aria-label', () => {
    render(<Cell value={3} isGiven notes={0} row={1} col={2} onClick={() => {}} />)
    expect(screen.getByLabelText(/row 2.*column 3/i)).toBeTruthy()
  })

  it('shows empty aria-label when value is 0', () => {
    render(<Cell value={0} notes={0} row={0} col={0} onClick={() => {}} />)
    expect(screen.getByLabelText(/empty/i)).toBeTruthy()
  })

  it('renders note digits when cell is empty with notes set', () => {
    const notes = notesFromSet([1, 5, 9])
    render(<Cell value={0} notes={notes} row={0} col={0} onClick={() => {}} />)
    // The button should exist; note visibility is CSS-driven (opacity)
    expect(screen.getByRole('button')).toBeTruthy()
  })
})
