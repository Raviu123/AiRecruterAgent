"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useUser } from '@/app/provider'

export default function AuthGuard({ children }) {
  const { session, authLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !session) {
      router.replace('/auth')
    }
  }, [authLoading, session, router])

  if (authLoading || !session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return children
}
