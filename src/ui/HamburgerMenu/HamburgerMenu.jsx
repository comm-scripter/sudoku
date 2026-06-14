import { useState, useEffect } from 'react'
import styles from './HamburgerMenu.module.css'
import { SecretLock } from './SecretLock.jsx'

function AboutPage() {
  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>About</h2>
      <p>
        Made with love for my amazing, creative, and brilliant Father!
      </p>
      <p>
        Happy Father's Day 2026!
      </p>
      <p>
        I love you Dad!!!
      </p>
      <p>
        KJ
      </p>
      <hr className={styles.secretLockDivider} />
      <SecretLock />
    </div>
  )
}

function HelpPage() {
  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>How to Play</h2>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>The Goal</h3>
        <p>
          Fill every empty cell in the 9×9 grid with a digit from 1 to 9. Every row,
          every column, and every 3×3 box must contain each digit exactly once — no repeats.
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Filling Cells</h3>
        <p>
          Tap any empty cell to select it (it highlights in blue), then tap a number on the
          pad below the board to place it. Tap the <strong>×</strong> button to erase the
          selected cell. On a keyboard, press <strong>1–9</strong> to enter a digit and
          <strong> Backspace</strong>, <strong>Delete</strong>, or <strong>0</strong> to erase.
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Notes Mode</h3>
        <p>
          Tap <strong>Notes</strong> in the toolbar (or press <strong>N</strong>) to toggle
          pencil-mark mode. While active, digits appear as small candidates inside the cell
          rather than filling it — useful for tracking which values are still possible. Tap
          Notes again to return to normal entry.
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Toolbar</h3>
        <ul className={styles.list}>
          <li>
            <strong>Home</strong> — Start a new game. If you have moves in progress you will
            be asked to confirm before the current puzzle is discarded.
          </li>
          <li>
            <strong>Undo</strong> — Step back one move at a time. You can undo all the way
            back to the start. Shortcut: <strong>Ctrl + Z</strong>.
          </li>
          <li>
            <strong>Notes</strong> — Toggle pencil-mark mode on or off.
          </li>
          <li>
            <strong>Pro Tip</strong> — Request a hint. A panel slides up describing a solving
            technique you can apply right now. Tap <strong>Highlight</strong> to light up the
            relevant cells on the board, or <strong>Next Tip</strong> to see a different
            technique.
          </li>
          <li>
            <strong>Settings</strong> — Open the settings panel to change difficulty and
            toggle game options.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Settings</h3>
        <ul className={styles.list}>
          <li>
            <strong>Difficulty</strong> — Easy, Medium, or Hard. Changing difficulty with no
            moves made starts a fresh game immediately; otherwise it applies to the next game.
          </li>
          <li>
            <strong>Algebra Opening</strong> — Clue cells display algebra equations at the
            start. Solve every equation to reveal its digit and unlock the Sudoku board.
          </li>
          <li>
            <strong>Highlight Errors</strong> — Cells that conflict with another digit in the
            same row, column, or box are shown in red as you fill them.
          </li>
          <li>
            <strong>High Contrast</strong> — Switches to a higher-contrast colour scheme for
            easier reading in bright light or for accessibility.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Algebra Opening</h3>
        <p>
          When Algebra Opening is enabled the puzzle begins with a pre-phase. Each given
          (clue) cell shows an algebra equation instead of its digit — for example
          <em> 3x + 2 = 11</em> or <em>2(x − 1) = 8</em>. Tap an equation cell to open the
          solver, enter the value of <em>x</em>, and tap <strong>Solve</strong>. When all
          equations are solved the board unlocks and the Sudoku phase begins. Your progress
          is shown in the header (e.g. <em>12/27 equations</em>).
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Keyboard Shortcuts</h3>
        <ul className={styles.list}>
          <li><strong>1 – 9</strong> — Enter a digit (or pencil mark in Notes mode)</li>
          <li><strong>Backspace / Delete / 0</strong> — Erase the selected cell</li>
          <li><strong>N</strong> — Toggle Notes mode</li>
          <li><strong>Ctrl + Z</strong> — Undo last move</li>
          <li><strong>Escape</strong> — Close any open panel or modal</li>
        </ul>
      </section>
    </div>
  )
}

export function HamburgerMenu() {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState('help')

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <>
      <button
        className={styles.hamburger}
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <span className={styles.bar} />
        <span className={styles.bar} />
        <span className={styles.bar} />
      </button>

      <div
        className={`${styles.backdrop} ${open ? styles.backdropVisible : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className={styles.drawerHeader}>
          <nav className={styles.nav}>
            <button
              className={`${styles.navBtn} ${page === 'help' ? styles.navActive : ''}`}
              onClick={() => setPage('help')}
            >
              Help
            </button>
            <button
              className={`${styles.navBtn} ${page === 'about' ? styles.navActive : ''}`}
              onClick={() => setPage('about')}
            >
              About
            </button>
          </nav>
          <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close menu">
            ✕
          </button>
        </div>

        <div className={styles.drawerContent}>
          {page === 'help' ? <HelpPage /> : <AboutPage />}
        </div>
      </div>
    </>
  )
}
