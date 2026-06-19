import { getCell } from '../../logic/BoardState.js'
import { EMPTY } from '../../logic/CellModel.js'
import { Cell } from '../Cell/Cell.jsx'
import styles from './Board.module.css'

export function Board({ board, selectedRow, selectedCol, highlightedCells = [], onCellSelect }) {
  if (!board) return null

  const selCell = selectedRow !== null ? getCell(board, selectedRow, selectedCol) : null
  // Once the selected cell has been correctly filled in, it should read as just
  // another same-value cell (green) rather than staying pinned in the "selected"
  // (dark blue) state — but its row/column/box stay highlighted, since selectedRow/
  // selectedCol are left pointing at it below. A wrong guess (isError) keeps the
  // cell selected/dark-blue so the user can immediately retype it.
  const anchorResolved = selCell != null && !selCell.isGiven && selCell.value !== EMPTY && !selCell.isError

  return (
    <div className={styles.board} role="grid" aria-label="Sudoku board">
      {Array.from({ length: 9 }, (_, row) =>
        Array.from({ length: 9 }, (_, col) => {
          const cell = getCell(board, row, col)
          const isAnchor    = row === selectedRow && col === selectedCol
          const isSelected  = isAnchor && !anchorResolved
          const isRelated   = !isAnchor && selCell != null && (
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
              equation={cell.equation}
              equationSolved={cell.equationSolved}
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
