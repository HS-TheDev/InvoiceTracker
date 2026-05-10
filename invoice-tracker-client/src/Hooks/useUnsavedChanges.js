import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'

export function useUnsavedChanges(when, message = 'You have unsaved changes. Leave anyway?') {
    useEffect(() => {
        if (!when) return
        const handler = (e) => {
            e.preventDefault()
            e.returnValue = message
            return message
        }
        window.addEventListener('beforeunload', handler)
        return () => window.removeEventListener('beforeunload', handler)
    }, [when, message])

    const blocker = useBlocker(when)

    useEffect(() => {
        if (blocker.state === 'blocked') {
            if (window.confirm(message)) blocker.proceed()
            else blocker.reset()
        }
    }, [blocker, message])
}
