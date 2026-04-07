'use server'

import { prisma } from '@/lib/prisma'

export async function submitFeedback(email: string, message: string, type: string = 'feedback') {
  if (!message.trim()) throw new Error('Message is required')
  await prisma.feedback.create({
    data: {
      type,
      email: email.trim() || null,
      message: message.trim(),
    },
  })
}
