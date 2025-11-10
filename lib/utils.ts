import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a phone number by removing +, spaces, and other formatting characters.
 * Example: "+22 01234567" -> "2201234567"
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return phone
  // Remove +, spaces, hyphens, parentheses, and other common formatting characters
  return phone.replace(/[\s+\-()]/g, '')
}
