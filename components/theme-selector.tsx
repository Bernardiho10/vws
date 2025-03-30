"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "@/context/theme-provider";
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function ThemeSelector() {
  const { theme, setTheme, customColor, setCustomColor, isDark } = useTheme();

  const handleRGBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor({
      ...customColor,
      [e.target.name]: parseInt(e.target.value) || 0,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 px-0">
          {theme === 'system' ? (
            <Laptop className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
          ) : isDark ? (
            <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
          ) : (
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Laptop className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="p-2">
          <Label className="text-sm font-medium">Custom RGB</Label>
          <div className="mt-2 grid gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="r" className="w-2">R</Label>
              <Input
                type="number"
                id="r"
                name="r"
                min="0"
                max="255"
                value={customColor.r}
                onChange={handleRGBChange}
                className="h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="g" className="w-2">G</Label>
              <Input
                type="number"
                id="g"
                name="g"
                min="0"
                max="255"
                value={customColor.g}
                onChange={handleRGBChange}
                className="h-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="b" className="w-2">B</Label>
              <Input
                type="number"
                id="b"
                name="b"
                min="0"
                max="255"
                value={customColor.b}
                onChange={handleRGBChange}
                className="h-8"
              />
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 