import { createContext, useContext, useState } from 'react'
import api from '../Services/Api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user')
        return stored ? JSON.parse(stored) : null
    })

    const login = async (username, password) => {
        const { data } = await api.post('/auth/login', { username, password })
        const u = { username: data.username, email: data.email, role: data.role, expiresAt: data.expiresAt }
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(u))
        setUser(u)
        return u
    }

    const register = async (username, email, password) => {
        const { data } = await api.post('/auth/register', { username, email, password })
        const u = { username: data.username, email: data.email, role: data.role, expiresAt: data.expiresAt }
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(u))
        setUser(u)
        return u
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
    }

    const isAuthenticated = !!user
    const isAdmin = user?.role === 'Admin'

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated, isAdmin }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
