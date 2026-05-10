import { useTheme } from '../Context/ThemeContext'

function ThemeToggle() {
    const { theme, toggle } = useTheme()
    return (
        <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="px-2 py-1 rounded hover:bg-white/10 transition-colors text-lg"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {theme === 'dark' ? '☀' : '☾'}
        </button>
    )
}

export default ThemeToggle
