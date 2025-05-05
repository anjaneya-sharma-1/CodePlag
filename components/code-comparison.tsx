"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Code, Copy, Check } from "lucide-react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type ComparisonResult = {
  file1: string
  file2: string
  similarityScore: number
  file1Content: string[]
  file2Content: string[]
  matchedSegments: Array<{
    file1Start: number
    file1End: number
    file2Start: number
    file2End: number
    lines: string[]
  }>
}

export default function CodeComparison({ result, threshold }: { result: ComparisonResult; threshold: number }) {
  const [showMatches, setShowMatches] = useState(true)
  const [activeTab, setActiveTab] = useState<"side-by-side" | "segments">("side-by-side")
  const [copiedFile, setCopiedFile] = useState<string | null>(null)

  const copyToClipboard = (text: string, fileId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedFile(fileId)
    setTimeout(() => setCopiedFile(null), 2000)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-red-500"
    if (score >= 70) return "text-orange-500"
    if (score >= 50) return "text-yellow-500"
    return "text-green-500"
  }

  const renderCodeWithHighlights = (fileName: string, isFile1: boolean) => {
    // Create a map of line numbers to highlight
    const highlightMap = new Map<number, boolean>()

    result.matchedSegments.forEach((segment) => {
      const start = isFile1 ? segment.file1Start : segment.file2Start
      const end = isFile1 ? segment.file1End : segment.file2End

      for (let i = start; i <= end; i++) {
        highlightMap.set(i, true)
      }
    })

    const lines = isFile1 ? result.file1Content : result.file2Content
    const fileId = isFile1 ? "file1" : "file2"

    return (
      <div className="relative">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <Code className="h-4 w-4 mr-2 text-pink-500" />
            <h3 className="text-sm font-medium">{fileName}</h3>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs hover:bg-slate-700"
                  onClick={() => copyToClipboard(lines.join("\n"), fileId)}
                >
                  {copiedFile === fileId ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy code to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
          <div className="overflow-x-auto">
            <pre className="p-4 text-xs">
              <code>
                {lines.map((line, index) => {
                  const isHighlighted = highlightMap.get(index)
                  return (
                    <div
                      key={index}
                      className={`${
                        isHighlighted && showMatches ? "bg-red-900/20 border-l-2 border-red-500 pl-2 -ml-2" : ""
                      } transition-colors`}
                    >
                      <span className="inline-block w-8 text-slate-500 select-none">{index + 1}</span>
                      {line}
                    </div>
                  )
                })}
              </code>
            </pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                result.similarityScore >= threshold ? "bg-red-500/20 text-red-400" : "bg-slate-700/50 text-slate-300"
              }`}
            >
              Similarity: {result.similarityScore.toFixed(1)}%
            </div>
            <Badge
              variant="outline"
              className={`${
                result.matchedSegments.length > 5
                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-slate-700/50 text-slate-300"
              }`}
            >
              {result.matchedSegments.length} matched segments
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {result.similarityScore >= threshold
              ? "This code is likely plagiarized based on structural similarities"
              : "Some similarities detected, but below the plagiarism threshold"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMatches(!showMatches)}
          className={`h-9 ${
            showMatches
              ? "bg-pink-500/20 text-pink-400 border-pink-500/30 hover:bg-pink-500/30"
              : "bg-slate-700/50 text-slate-300"
          }`}
        >
          {showMatches ? (
            <>
              <EyeOff className="h-3.5 w-3.5 mr-1.5" />
              Hide Matches
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Show Matches
            </>
          )}
        </Button>
      </div>

      <Tabs
        defaultValue="side-by-side"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "side-by-side" | "segments")}
        className="w-full"
      >
        <TabsList className="mb-4 bg-slate-700/50 w-full">
          <TabsTrigger
            value="side-by-side"
            className="flex-1 data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-500"
          >
            Side by Side Comparison
          </TabsTrigger>
          <TabsTrigger
            value="segments"
            className="flex-1 data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-500"
          >
            Matched Segments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="side-by-side" className="mt-0">
          <div className="grid md:grid-cols-2 gap-6">
            {renderCodeWithHighlights(result.file1, true)}
            {renderCodeWithHighlights(result.file2, false)}
          </div>
        </TabsContent>

        <TabsContent value="segments" className="mt-0">
          <div className="space-y-4">
            {result.matchedSegments.map((segment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="bg-slate-800/50 p-4 rounded-lg border border-slate-700"
              >
                <div className="flex justify-between items-center mb-3">
                  <Badge variant="outline" className="bg-slate-700/50 text-slate-300">
                    Segment {index + 1}
                  </Badge>
                  <div className="text-xs text-slate-400">{segment.lines.length} lines</div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-xs mb-3">
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <span className="text-slate-400">File 1:</span>{" "}
                    <span className="text-pink-400">
                      Lines {segment.file1Start}-{segment.file1End}
                    </span>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <span className="text-slate-400">File 2:</span>{" "}
                    <span className="text-pink-400">
                      Lines {segment.file2Start}-{segment.file2End}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                  <pre className="p-3 text-xs overflow-x-auto">
                    <code>{segment.lines.join("\n")}</code>
                  </pre>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
