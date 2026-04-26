import { useState, useEffect } from 'react'
import api from '../services/api'

function ClientsPage(){

    const [clients, setClients] = useState([])
    const [name, setName] = useState('')
    const [email, setEmail] =  useState('')
    const [phone, setPhone] = useState('')
    useEffect(()=>{
        const fetchAllClients = async () => {
            const result = await api.get(`/clients`);
            setClients(result.data);}
            fetchAllClients();
    },[])

    const handleSubmit = async () => {
    if (!name || !email || !phone) return
    await api.post('/clients', { name, email, phone, address: '' })
    const result = await api.get('/clients')
    setClients(result.data)
    setName('')
    setEmail('')
    setPhone('')
}
    const handleDelete = async (id) => {
    await api.delete(`/clients/${id}`)
    const result = await api.get('/clients')
    setClients(result.data)
}
    
    return (
        <div className='p-6'>
            <h1 className='text-2xl font-bold mb-4'> Clients </h1>
            {clients.map(client=>(
                <div key={client.id} className='border p-4 mb-2 rounded'>
                    <p className='font-bold'>{client.name}</p>
                    <p >{client.email}</p>
                    <p >{client.phone}</p>
                    <button className='border-2 p-2 border-blue-300 text-red-500 flex-1' onClick={() => handleDelete(client.id)}>Delete</button>
                </div>
            ))}
            <div>
                <form>
               <h1 className='text-2xl font-bold mb-4'> Client Register </h1> 
               <label className='p-1'>Name</label>
               <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                    className="border p-2 rounded"
                />
               <label className='p-1' >Email</label>
               <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="border p-2 rounded"
                />
               <label className='p-2'>Phone</label>
               <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone"
                    className="border p-2 rounded"
                />
               <button onClick={handleSubmit} className="bg-blue-500 text-white p-2 rounded ">
                    Add Client
                </button>
               </form>
            </div>
        </div>
    );
    
} 

export default ClientsPage