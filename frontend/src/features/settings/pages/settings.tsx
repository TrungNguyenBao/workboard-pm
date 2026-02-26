import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Header } from '@/features/auth/components/header'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { useAuthStore } from '@/stores/auth.store'
import { generateInitials } from '@/shared/lib/utils'
import api from '@/shared/lib/api'
import type { AuthUser } from '@/stores/auth.store'

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [name, setName] = useState(user?.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [saved, setSaved] = useState(false)

  const save = useMutation({
    mutationFn: (data: Record<string, string | null>) =>
      api.patch<AuthUser>('/auth/me', data).then((r) => r.data),
    onSuccess: (updated) => {
      setUser(updated)
      setSaved(true)
      setCurrentPw('')
      setNewPw('')
      setTimeout(() => setSaved(false), 2500)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Record<string, string | null> = {}
    if (name.trim() && name !== user?.name) payload.name = name.trim()
    if (avatarUrl !== (user?.avatar_url ?? '')) payload.avatar_url = avatarUrl || null
    if (newPw) {
      payload.current_password = currentPw
      payload.new_password = newPw
    }
    if (Object.keys(payload).length > 0) save.mutate(payload)
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto w-full pt-8 px-6 pb-12">
          {/* Avatar preview */}
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-xl">{generateInitials(name || 'U')}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-neutral-900">{name || user?.name}</p>
              <p className="text-sm text-neutral-400">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">Avatar URL</label>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">Email</label>
              <input
                value={user?.email ?? ''}
                disabled
                className="w-full rounded border border-border px-3 py-2 text-sm bg-neutral-50 text-neutral-400 cursor-not-allowed"
              />
            </div>

            <hr className="border-border" />
            <p className="text-sm font-semibold text-neutral-700">Change Password</p>

            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">Current Password</label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 block mb-1">New Password</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
              </Button>
              {save.isError && (
                <p className="text-sm text-red-500">
                  {(save.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to save'}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
