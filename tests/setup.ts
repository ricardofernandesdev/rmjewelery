import { vi } from 'vitest'

// Mock next/cache to prevent revalidatePath errors in test environment.
// The afterChange hooks in Categories and Products collections call
// revalidatePath which requires the Next.js static generation store.
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: any) => fn),
}))
