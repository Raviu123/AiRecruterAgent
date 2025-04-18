"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/services/supabaseClient'
import UserDetailContext from '@/context/UserDetailContext';

import { useContext} from 'react'

const Provider = ({children}) => {

    const [user, setUser] = useState();

    useEffect(() => {
        console.log('Provider component mounted')
        createNewUser()
    }, [])

    const createNewUser = async () => {
        console.log('Creating/checking user...')
        const { data: { user } } = await supabase.auth.getUser()
        console.log('Current user:', user)
        if (!user) {
            console.log('No user found')
            return
        }

        // check if user already exists
        const { data: users, error } = await supabase
            .from('Users')
            .select('*')   
            .eq('email', user.email)

        if (error) {
            console.error('Error checking user:', error)
            return
        }

        console.log('Existing users found:', users)
        if (!users || users.length === 0) {
            console.log('Creating new user record...')
            const { data, error: insertError } = await supabase
                .from('Users')
                .insert([{
                    name: user.user_metadata?.name,
                    email: user.email,
                    picture: user.user_metadata?.picture
                }])
                .select()

            if (insertError) {
                console.error('Error creating user:', insertError)
            } else {
                console.log('New user created successfully!')
                setUser(data[0])
            }
        } else {
            console.log('User already exists in database')
            setUser(users[0])
        }
    }

    return (
        <UserDetailContext.Provider value={{user, setUser}}>
            <div>{children}</div>
        </UserDetailContext.Provider>
        
    )
}

export default Provider

export const useUser = () => {
    const context = useContext(UserDetailContext);
    return context
}