import { getCell } from '../../logic/BoardState.js'
import { Cell } from '../Cell/Cell.jsx'
import styles from './Board.module.css'

export function Board({ board, selectedRow, selectedCol, highlightedCells = [], onCellSelect }) {
  if (!board) return null

  const selCell = selectedRow !== null ? getCell(board, selectedRow, selectedCol) : null

  return (
    <div className={styles.board} role="grid" aria-label="Sudoku board">
      {Array.from({ length: 9 }, (_, row) =>
        Array.from({ length: 9 }, (_, col) => {
          const cell = getCell(board, row, col)
          const isSelected  = row === selectedRow && col === selectedCol
          const isRelated   = !isSelected && selCell != null && (
            row === selectedRow ||
            col === selectedCol ||
            (Math.floor(row / 3) === Math.floor(selectedRow / 3) &&
             Math.floor(col / 3) === Math.floor(selectedCol / 3))
          )
          const isSameValue = !isSelected && selCell?.value > 0 && cell.value === selCell.value
          const isHighlighted = highlightedCells.some(h => h.row === row && h.col === col)

          return (
            <Cell
              key={`${row}-${col}`}
              row={row}
              col={col}
              value={cell.value}
              isGiven={cell.isGiven}
              notes={cell.notes}
              isSelected={isSelected}
              isRelated={isRelated}
              isSameValue={isSameValue}
              isError={cell.isError}
              isHighlighted={isHighlighted}
              onClick={onCellSelect}
            />
          )
        })
      )}
    </div>
  )
}
