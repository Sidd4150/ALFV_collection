'use client'

import { useTransition } from 'react'
import { approveSubmission, rejectSubmission } from '@/app/actions/submissions'

export function SubmissionActions({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex gap-2 shrink-0">
      <button
        disabled={isPending}
        onClick={() => startTransition(() => approveSubmission(id))}
        className="text-xs font-bold px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-colors"
      >
        Approve
      </button>
      <button
        disabled={isPending}
        onClick={() => startTransition(() => rejectSubmission(id))}
        className="text-xs font-bold px-3 py-1.5 rounded-md bg-red-700 hover:bg-red-800 text-white disabled:opacity-50 transition-colors"
      >
        Reject
      </button>
    </div>
  )
}
