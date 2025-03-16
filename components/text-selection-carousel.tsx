"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface TextItem {
  readonly id: string
  readonly text: string
}

interface TextSelectionCarouselProps {
  readonly items: readonly TextItem[]
  readonly selectedItemId: string | null
  readonly onSelect: (id: string) => void
}

interface ScrollConfig {
  readonly distance: number
  readonly behavior: ScrollBehavior
}

const SCROLL_AMOUNT = {
  distance: 200,
  behavior: "smooth" as const
} as const

export function TextSelectionCarousel({ items, selectedItemId, onSelect }: TextSelectionCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleScroll = ({ distance, behavior }: ScrollConfig): void => {
    if (!scrollContainerRef.current) return
    scrollContainerRef.current.scrollBy({
      left: distance,
      behavior
    })
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="outline"
        size="icon"
        className="shrink-0 z-10"
        onClick={() => handleScroll({ ...SCROLL_AMOUNT, distance: -SCROLL_AMOUNT.distance })}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div 
        ref={scrollContainerRef}
        className={cn(
          "flex-1 flex gap-4 overflow-x-auto py-2 px-4",
          "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
          "scroll-smooth snap-x snap-mandatory"
        )}
      >
        {items.map((item) => (
          <Button
            key={item.id}
            variant={selectedItemId === item.id ? "default" : "outline"}
            className={cn(
              "min-w-fit px-4 py-2 shrink-0",
              "snap-center transition-transform",
              selectedItemId === item.id ? "scale-110" : "scale-100 hover:scale-105"
            )}
            onClick={() => onSelect(item.id)}
          >
            <span className="font-medium">{item.text}</span>
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="shrink-0 z-10"
        onClick={() => handleScroll(SCROLL_AMOUNT)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
