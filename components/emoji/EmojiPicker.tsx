import React from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useTheme } from 'next-themes'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
}

interface EmojiObject {
  native: string
  id: string
  name: string
  unified: string
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const { theme } = useTheme()

  return (
    <div className="w-full flex justify-center">
      <Picker
        data={data}
        onEmojiSelect={(emoji: EmojiObject) => onSelect(emoji.native)}
        theme={theme === 'dark' ? 'dark' : 'light'}
        set="native"
        autoFocus
        skinTonePosition="none"
        previewPosition="none"
        maxFrequentRows={0}
      />
    </div>
  )
} 