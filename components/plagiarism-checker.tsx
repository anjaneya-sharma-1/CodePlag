"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Upload,
  FileCode2,
  AlertTriangle,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Settings,
  BarChart3,
  FileSearch,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import CodeComparison from "@/components/code-comparison"
import { initWasm, detectPlagiarism } from "@/lib/wasm-interface"

type FileData = {
  id: string
  name: string
  content: string
  size: number
}

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

export default function PlagiarismChecker() {
  const [files, setFiles] = useState<FileData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<ComparisonResult[]>([])
  const [threshold, setThreshold] = useState(70)
  const [wasmLoaded, setWasmLoaded] = useState(false)
  const [activeComparison, setActiveComparison] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadWasm = async () => {
      try {
        await initWasm()
        setWasmLoaded(true)
      } catch (err) {
        setError("Failed to load WebAssembly module. Please try again or check browser compatibility.")
        console.error("WASM load error:", err)
      }
    }

    loadWasm()
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files
    if (!uploadedFiles) return

    setError(null)

    const filePromises: Promise<FileData>[] = []

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i]

      // Check if file is a C++ file
      if (!file.name.endsWith(".cpp") && !file.name.endsWith(".h") && !file.name.endsWith(".hpp")) {
        setError("Only C++ files (.cpp, .h, .hpp) are supported")
        return
      }

      const reader = new FileReader()

      const filePromise = new Promise<FileData>((resolve) => {
        reader.onload = (e) => {
          const content = e.target?.result as string
          resolve({
            id: `file-${Date.now()}-${i}`,
            name: file.name,
            content,
            size: file.size,
          })
        }
        reader.readAsText(file)
      })

      filePromises.push(filePromise)
    }

    Promise.all(filePromises).then((newFiles) => {
      setFiles((prevFiles) => [...prevFiles, ...newFiles])
    })

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (!droppedFiles) return

    setError(null)

    const filePromises: Promise<FileData>[] = []

    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i]

      // Check if file is a C++ file
      if (!file.name.endsWith(".cpp") && !file.name.endsWith(".h") && !file.name.endsWith(".hpp")) {
        setError("Only C++ files (.cpp, .h, .hpp) are supported")
        return
      }

      const reader = new FileReader()

      const filePromise = new Promise<FileData>((resolve) => {
        reader.onload = (e) => {
          const content = e.target?.result as string
          resolve({
            id: `file-${Date.now()}-${i}`,
            name: file.name,
            content,
            size: file.size,
          })
        }
        reader.readAsText(file)
      })

      filePromises.push(filePromise)
    }

    Promise.all(filePromises).then((newFiles) => {
      setFiles((prevFiles) => [...prevFiles, ...newFiles])
    })
  }

  const removeFile = (id: string) => {
    setFiles(files.filter((file) => file.id !== id))
  }

  const toggleComparison = (id: string) => {
    if (activeComparison === id) {
      setActiveComparison(null)
    } else {
      setActiveComparison(id)
    }
  }

  const runPlagiarismCheck = async () => {
    if (files.length < 2) {
      setError("Please upload at least 2 files to compare")
      return
    }

    if (!wasmLoaded) {
      setError("WebAssembly module is not loaded yet. Please wait or refresh the page.")
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setResults([])
    setError(null)

    try {
      const totalComparisons = (files.length * (files.length - 1)) / 2
      let completedComparisons = 0
      const newResults: ComparisonResult[] = []

      // Compare each file with every other file
      for (let i = 0; i < files.length; i++) {
        for (let j = i + 1; j < files.length; j++) {
          const file1 = files[i]
          const file2 = files[j]

          // Call the WebAssembly function through our interface
          const result = await detectPlagiarism(file1.content, file2.content, threshold / 100)

          newResults.push({
            file1: file1.name,
            file2: file2.name,
            similarityScore: result.similarityScore * 100,
            matchedSegments: result.matchedSegments,
            file1Content: file1.content.split('\n'),
            file2Content: file2.content.split('\n')
          })

          completedComparisons++
          setProgress(Math.floor((completedComparisons / totalComparisons) * 100))
        }
      }

      // Sort results by similarity score (highest first)
      newResults.sort((a, b) => b.similarityScore - a.similarityScore)
      setResults(newResults)
    } catch (err) {
      console.error("Plagiarism detection error:", err)
      setError("An error occurred during plagiarism detection")
    } finally {
      setIsProcessing(false)
      setProgress(100)
    }
  }

  const clearAll = () => {
    setFiles([])
    setResults([])
    setError(null)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-red-500"
    if (score >= 70) return "text-orange-500"
    if (score >= 50) return "text-yellow-500"
    return "text-green-500"
  }

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-red-500"
    if (score >= 70) return "bg-orange-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-red-500">Error</AlertTitle>
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-[1fr_300px] gap-8">
        <Card className="border-none shadow-xl bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-700/50 pb-4">
            <CardTitle className="flex items-center text-2xl">
              <FileSearch className="mr-3 h-6 w-6 text-pink-500" />
              Upload Files
            </CardTitle>
            <CardDescription className="text-slate-300">
              Upload C++ source files to check for plagiarism
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6">
              <div
                className={`relative border-2 ${
                  isDragging ? "border-pink-500 bg-pink-500/10" : "border-slate-700 hover:border-pink-500/50"
                } border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept=".cpp,.h,.hpp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                

                <div className="relative z-10">
                  <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-pink-500" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Drag and drop files here</h3>
                  <p className="text-slate-300">or click to browse</p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Badge variant="outline" className="bg-slate-700/50 text-slate-300">
                      .cpp
                    </Badge>
                    <Badge variant="outline" className="bg-slate-700/50 text-slate-300">
                      .h
                    </Badge>
                    <Badge variant="outline" className="bg-slate-700/50 text-slate-300">
                      .hpp
                    </Badge>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {files.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg flex items-center">
                        <FileCode2 className="mr-2 h-5 w-5 text-pink-500" />
                        Uploaded Files
                        <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
                          {files.length}
                        </Badge>
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAll}
                        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear All
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
                      {files.map((file, index) => (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="flex items-center justify-between bg-slate-700/30 p-3 rounded-lg border border-slate-700/50 hover:border-pink-500/30 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center mr-3">
                              <FileText className="h-4 w-4 text-pink-500" />
                            </div>
                            <div>
                              <span className="text-sm font-medium truncate max-w-[200px] block">{file.name}</span>
                              <span className="text-xs text-slate-400">
                                {(file.size / 1024).toFixed(1)} KB • {file.content.split("\n").length} lines
                              </span>
                            </div>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFile(file.id)}
                                  className="h-7 w-7 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/20"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove file</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-slate-800/50 backdrop-blur-sm h-fit">
          <CardHeader className="border-b border-slate-700/50 pb-4">
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5 text-pink-500" />
              Settings
            </CardTitle>
            <CardDescription className="text-slate-300">Configure detection parameters</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Similarity Threshold</label>
                <Badge variant="outline" className="bg-slate-700 text-slate-300">
                  {threshold}%
                </Badge>
              </div>
              <div className="relative pt-1">
                <Slider
                  value={[threshold]}
                  min={30}
                  max={100}
                  step={1}
                  onValueChange={(value) => setThreshold(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>Low (30%)</span>
                  <span>Medium (65%)</span>
                  <span>High (100%)</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Matches with similarity above this threshold will be flagged as potential plagiarism
              </p>
            </div>

            <Button
              onClick={runPlagiarismCheck}
              disabled={isProcessing || files.length < 2 || !wasmLoaded}
              className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white border-0"
            >
              {isProcessing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <FileSearch className="mr-2 h-4 w-4" />
                  Run Plagiarism Check
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-none shadow-xl bg-slate-800/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-pink-500" />
                  Processing
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Analyzing files using Shingling and Jaccard Similarity algorithms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-pink-500 to-violet-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  ></motion.div>
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-sm text-slate-400">{progress}% complete</p>
                  <p className="text-sm text-slate-400">
                    {Math.floor((files.length * (files.length - 1)) / 2)} comparisons
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-none shadow-xl bg-slate-800/50 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-700/50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5 text-pink-500" />
                    Results
                  </CardTitle>
                  <Badge variant="outline" className="bg-slate-700 text-slate-300">
                    {results.filter((r) => r.similarityScore >= threshold).length} potential cases detected
                  </Badge>
                </div>
                <CardDescription className="text-slate-300">
                  Files with similarity scores above {threshold}% are flagged as potential plagiarism
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="mb-6 w-full bg-slate-700/50">
                    <TabsTrigger
                      value="all"
                      className="flex-1 data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-500"
                    >
                      All Results
                    </TabsTrigger>
                    <TabsTrigger
                      value="flagged"
                      className="flex-1 data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-500"
                    >
                      Flagged ({results.filter((r) => r.similarityScore >= threshold).length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4 mt-0">
                    {results.map((result, index) => (
                      <motion.div
                        key={`${result.file1}-${result.file2}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30">
                          <div
                            className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                              result.similarityScore >= threshold
                                ? "bg-red-500/10 hover:bg-red-500/20"
                                : "hover:bg-slate-700/50"
                            }`}
                            onClick={() => toggleComparison(`comparison-${index}`)}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex flex-col items-center justify-center w-16">
                                <div
                                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                                    result.similarityScore >= threshold ? "bg-red-500/20" : "bg-slate-700/50"
                                  }`}
                                >
                                  <span className={`text-lg font-bold ${getScoreColor(result.similarityScore)}`}>
                                    {Math.round(result.similarityScore)}%
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center">
                                  <FileCode2 className="h-4 w-4 mr-2 text-slate-400" />
                                  <p className="text-sm font-medium">{result.file1}</p>
                                </div>
                                <div className="flex items-center mt-1">
                                  <FileCode2 className="h-4 w-4 mr-2 text-slate-400" />
                                  <p className="text-sm font-medium">{result.file2}</p>
                                </div>
                                <div className="flex items-center mt-2">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      result.matchedSegments.length > 5
                                        ? "bg-red-500/20 text-red-300 border-red-500/30"
                                        : "bg-slate-700/50 text-slate-300"
                                    }`}
                                  >
                                    {result.matchedSegments.length} matched segments
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {result.similarityScore >= threshold && (
                                <AlertTriangle className={`h-5 w-5 mr-3 ${getScoreColor(result.similarityScore)}`} />
                              )}
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                  activeComparison === `comparison-${index}`
                                    ? "bg-pink-500/20 text-pink-500"
                                    : "bg-slate-700/50 text-slate-300"
                                }`}
                              >
                                {activeComparison === `comparison-${index}` ? (
                                  <ChevronUp className="h-5 w-5" />
                                ) : (
                                  <ChevronDown className="h-5 w-5" />
                                )}
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {activeComparison === `comparison-${index}` && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div className="p-6 border-t border-slate-700">
                                  <CodeComparison result={result} threshold={threshold} />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </TabsContent>

                  <TabsContent value="flagged" className="space-y-4 mt-0">
                    {results
                      .filter((result) => result.similarityScore >= threshold)
                      .map((result, index) => (
                        <motion.div
                          key={`flagged-${result.file1}-${result.file2}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30">
                            <div
                              className="flex items-center justify-between p-4 cursor-pointer bg-red-500/10 hover:bg-red-500/20 transition-colors"
                              onClick={() => toggleComparison(`flagged-${index}`)}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="flex flex-col items-center justify-center w-16">
                                  <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <span className={`text-lg font-bold ${getScoreColor(result.similarityScore)}`}>
                                      {Math.round(result.similarityScore)}%
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center">
                                    <FileCode2 className="h-4 w-4 mr-2 text-slate-400" />
                                    <p className="text-sm font-medium">{result.file1}</p>
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <FileCode2 className="h-4 w-4 mr-2 text-slate-400" />
                                    <p className="text-sm font-medium">{result.file2}</p>
                                  </div>
                                  <div className="flex items-center mt-2">
                                    <Badge
                                      variant="outline"
                                      className="bg-red-500/20 text-red-300 border-red-500/30 text-xs"
                                    >
                                      {result.matchedSegments.length} matched segments
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <AlertTriangle className={`h-5 w-5 mr-3 ${getScoreColor(result.similarityScore)}`} />
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                    activeComparison === `flagged-${index}`
                                      ? "bg-pink-500/20 text-pink-500"
                                      : "bg-slate-700/50 text-slate-300"
                                  }`}
                                >
                                  {activeComparison === `flagged-${index}` ? (
                                    <ChevronUp className="h-5 w-5" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5" />
                                  )}
                                </div>
                              </div>
                            </div>

                            <AnimatePresence>
                              {activeComparison === `flagged-${index}` && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div className="p-6 border-t border-slate-700">
                                    <CodeComparison result={result} threshold={threshold} />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
