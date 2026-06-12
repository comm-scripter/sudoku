import styles from './Cell.module.css'
import { getNotes } from '../../logic/NotesModel.js'

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export function Cell({
  row, col, value, isGiven, notes, equation, equationSolved,
  isSelected, isRelated, isSameValue, isError, isHighlighted,
  onClick,
}) {
  const noteDigits = getNotes(notes)
  const isEmpty = value === 0

  const showEquation = isGiven && equation != null && !equationSolved

  const cls = [
    styles.cell,
    isGiven       ? styles.given      : styles.input,
    showEquation  ? styles.unsolved   : '',
    isSelected    ? styles.selected   : '',
    isRelated     ? styles.related    : '',
    isSameValue   ? styles.sameValue  : '',
    isError       ? styles.error      : '',
    isHighlighted ? styles.highlighted: '',
    col > 0 && col % 3 === 0 ? styles.boxBorderLeft : '',
    row > 0 && row % 3 === 0 ? styles.boxBorderTop  : '',
  ].filter(Boolean).join(' ')

  let ariaLabel
  if (showEquation) {
    ariaLabel = `Row ${row + 1}, Column ${col + 1}, solve equation: ${equation}`
  } else {
    ariaLabel = `Row ${row + 1}, Column ${col + 1}${value ? `, ${value}` : ', empty'}`
  }

  return (
    <button
      className={cls}
      onClick={() => onClick(row, col)}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
    >
      {showEquation ? (
        <span className={styles.equation} aria-hidden>
          {equation}
        </span>
      ) : isEmpty ? (
        <span className={styles.notes} aria-hidden>
          {DIGITS.map(d => (
            <span
              key={d}
              className={`${styles.note} ${noteDigits.includes(d) ? styles.noteVisible : ''}`}
            >
              {d}
            </span>
          ))}
        </span>
      ) : (
        <span className={styles.value}>{value}</span>
      )}
    </button>
  )
}
