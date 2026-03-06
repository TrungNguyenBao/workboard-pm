# Phase 08 — Frontend Auth Pages

## Overview
- **Priority:** High
- **Status:** Pending
- **Description:** Login and register pages with form validation, error states, loading states

## Related Code Files

### Create
```
frontend/src/features/auth/
  api/auth.api.ts
  hooks/useLogin.ts
  hooks/useRegister.ts
  pages/LoginPage.tsx
  pages/RegisterPage.tsx
  components/AuthLayout.tsx    # centered card wrapper
  schemas/auth.schemas.ts      # Zod validation schemas
```

## Implementation Steps

### 1. auth.api.ts
```typescript
import { api } from '@/shared/lib/axiosInstance'

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<TokenResponse>('/auth/register', data).then(r => r.data),
  login: (data: LoginRequest) =>
    api.post<TokenResponse>('/auth/login', data).then(r => r.data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<User>('/auth/me').then(r => r.data),
}
```

### 2. Zod schemas (schemas/auth.schemas.ts)
```typescript
export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name too short').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
  workspace_name: z.string().min(2, 'Workspace name too short').max(100),
})
```

### 3. LoginPage.tsx
```typescript
// Layout: centered card (420px wide)
// WorkBoard logo + "Sign in to WorkBoard" heading
// Email + password inputs (shadcn Input)
// Show/hide password toggle
// Remember me checkbox (cosmetic in v1)
// "Sign in" button (loading spinner while submitting)
// "Don't have an account? Sign up" link
// Error toast on 401

function LoginPage() {
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(loginSchema) })
  const login = useLogin()

  const onSubmit = async (data) => {
    const result = await login.mutateAsync(data)
    useAuthStore.getState().setAuth(result.user, result.access_token)
    navigate('/')
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input {...register('email')} type="email" label="Email" />
        <PasswordInput {...register('password')} label="Password" />
        <Button type="submit" loading={login.isPending}>Sign in</Button>
      </form>
    </AuthLayout>
  )
}
```

### 4. RegisterPage.tsx
```typescript
// Layout: centered card (480px wide)
// WorkBoard logo + "Create your account" heading
// Name + Workspace name + Email + Password fields
// Password strength indicator
// "Create account" button
// "Already have an account? Sign in" link
// On success: setAuth() + navigate('/')
```

### 5. AuthLayout.tsx
```typescript
// Full-page centered layout
// Background: light gray (#F9F9FB)
// Card: white, border, 24px padding, 12px radius, max-w-md
// WorkBoard logo at top (SVG or text logo)
```

## Todo
- [ ] Create auth.api.ts
- [ ] Create Zod schemas
- [ ] Create AuthLayout (full-page centered)
- [ ] Build LoginPage with form + validation + error handling
- [ ] Build RegisterPage with 4 fields + password strength
- [ ] Add toast on error (shadcn Toaster)
- [ ] Test: login with wrong password → error message shown
- [ ] Test: register → auto-login → redirect to dashboard

## Success Criteria
- Login with valid credentials → sets auth store → redirects to /
- Login with invalid credentials → shows error, does not navigate
- Register with existing email → shows "Email already in use"
- Form validation runs before submission (Zod)
- Password field has show/hide toggle

## Next Steps
→ Phase 09: project views
