'use server'

import { prisma } from '@/lib/prisma'

export async function submitFeedback(email: string, message: string) {
  if (!message.trim()) throw new Error('Message is required')
  await prisma.feedback.create({
    data: {
      email: email.trim() || null,
      message: message.trim(),
    },
  })
}
