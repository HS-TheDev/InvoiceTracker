import api from './Api'

export const generateInvoiceItems = (description) =>
    api.post('/ai/generate-items', { description })

export const getClientRisk = (clientId) =>
    api.get(`/ai/client-risk/${clientId}`)

export const dashboardQuery = (query) =>
    api.post('/ai/dashboard-query', { query })

export const getOverdueReminder = (invoiceId) =>
    api.get(`/ai/overdue-reminder/${invoiceId}`)
