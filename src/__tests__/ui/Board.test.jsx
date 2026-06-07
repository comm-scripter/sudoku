import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Board } from '../../ui/Board/Board.jsx'
import { createBoard } from '../../logic/BoardState.js'

const SAMPLE = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'

describe('Board', () => {
  it('renders 81 cell buttons', () => {
    const board = createBoard(SAMPLE)
    render(<Board board={board} selectedRow={null} selectedCol={null} onCellSelect={() => {}} />)
    expect(screen.getAllByRole('button')).toHaveLength(81)
  })

  it('returns null when board is null', () => {
    const { container } = render(
      <Board board={null} selectedRow={null} selectedCol={null} onCellSelect={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('calls onCellSelect with (row, col) when a cell is clicked', async () => {
    const user    = userEvent.setup()
    const board   = createBoard(SAMPLE)
    const onSelect = vi.fn()
    render(<Board board={board} selectedRow={null} selectedCol={null} onCellSelect={onSelect} />)
    await user.click(screen.getAllByRole('button')[0])
    expect(onSelect).toHaveBeenCalledWith(0, 0)
  })

  it('has accessible aria-label on the grid', () => {
    const board = createBoard(SAMPLE)
    render(<Board board={board} selectedRow={null} selectedCol={null} onCellSelect={() => {}} />)
    expect(screen.getByRole('grid', { name: /sudoku board/i })).toBeTruthy()
  })
})
