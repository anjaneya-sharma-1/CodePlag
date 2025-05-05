// This file provides the interface between our React app and the C++ WebAssembly module

// Type definitions for the data structures we'll use
type MatchedSegment = {
  file1Start: number
  file1End: number
  file2Start: number
  file2End: number
  lines: string[]
}

type PlagiarismResult = {
  similarityScore: number
  matchedSegments: MatchedSegment[]
}

// WebAssembly module instance
let wasmModule: any = null

/**
 * Initialize the WebAssembly module
 */
export async function initWasm(): Promise<void> {
  try {
    // In a real implementation, we would load the actual WASM module here
    // For this example, we'll simulate the WASM functionality with JavaScript

    // Simulating WASM module loading
    await new Promise((resolve) => setTimeout(resolve, 1000))

    wasmModule = {
      // This would be the exported functions from the C++ WASM module
      // We're simulating them here
      detectPlagiarism: simulateDetectPlagiarism,
    }

    return Promise.resolve()
  } catch (error) {
    console.error("Failed to initialize WebAssembly module:", error)
    return Promise.reject(error)
  }
}

/**
 * Detect plagiarism between two code files
 * This would call the C++ implementation in the WASM module
 */
export async function detectPlagiarism(code1: string, code2: string, threshold: number): Promise<PlagiarismResult> {
  if (!wasmModule) {
    throw new Error("WebAssembly module not initialized")
  }

  // In a real implementation, this would call the C++ function in the WASM module
  // For this example, we're using our JavaScript simulation
  return wasmModule.detectPlagiarism(code1, code2, threshold)
}

/**
 * Simulates the C++ plagiarism detection algorithm in JavaScript
 * In a real implementation, this would be replaced by the actual C++ code compiled to WASM
 */
function simulateDetectPlagiarism(code1: string, code2: string, threshold: number): PlagiarismResult {
  // Split the code into lines
  const lines1 = code1.split("\n")
  const lines2 = code2.split("\n")

  // Preprocessing: remove comments and whitespace
  const cleanLines1 = preprocessCode(lines1)
  const cleanLines2 = preprocessCode(lines2)

  // Create shingles (k-line sequences)
  const k = 3 // k-line shingle size
  const shingles1 = createShingles(cleanLines1, k)
  const shingles2 = createShingles(cleanLines2, k)

  // Calculate Jaccard similarity
  const { similarity, matchedShingles } = calculateJaccardSimilarity(shingles1, shingles2)

  // Convert matched shingles to matched segments
  const matchedSegments = convertToMatchedSegments(matchedShingles, lines1, lines2, k)

  return {
    similarityScore: similarity,
    matchedSegments,
  }
}

// Update the preprocessCode function to normalize variable names
function preprocessCode(lines: string[]): string[] {
  const cleanLines: string[] = []
  let inMultilineComment = false

  // For variable name normalization
  const variableMap = new Map<string, string>()
  const nextVarId = 1

  for (const line of lines) {
    let cleanLine = line.trim()

    // Skip empty lines
    if (cleanLine === "") continue

    // Handle multiline comments
    if (inMultilineComment) {
      const endCommentIndex = cleanLine.indexOf("*/")
      if (endCommentIndex !== -1) {
        cleanLine = cleanLine.substring(endCommentIndex + 2)
        inMultilineComment = false
      } else {
        continue
      }
    }

    // Remove single-line comments
    const singleCommentIndex = cleanLine.indexOf("//")
    if (singleCommentIndex !== -1) {
      cleanLine = cleanLine.substring(0, singleCommentIndex).trim()
    }

    // Remove multiline comments on this line
    let startCommentIndex = cleanLine.indexOf("/*")
    while (startCommentIndex !== -1) {
      const endCommentIndex = cleanLine.indexOf("*/", startCommentIndex)
      if (endCommentIndex !== -1) {
        cleanLine = cleanLine.substring(0, startCommentIndex) + cleanLine.substring(endCommentIndex + 2)
      } else {
        cleanLine = cleanLine.substring(0, startCommentIndex)
        inMultilineComment = true
        break
      }
      startCommentIndex = cleanLine.indexOf("/*")
    }

    // Skip if line is now empty
    if (cleanLine === "") continue

    // Normalize whitespace
    cleanLine = cleanLine.replace(/\s+/g, " ")

    // Normalize variable names
    cleanLine = normalizeVariables(cleanLine, variableMap, nextVarId)

    cleanLines.push(cleanLine)
  }

  return cleanLines
}

// Add a new function to normalize variable names
function normalizeVariables(line: string, variableMap: Map<string, string>, nextVarId: number): string {
  // Regular expression to match C++ identifiers (variable names)
  const identifierRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g

  // Keywords and common types that should not be normalized
  const cppKeywords = new Set([
    "auto",
    "break",
    "case",
    "char",
    "const",
    "continue",
    "default",
    "do",
    "double",
    "else",
    "enum",
    "extern",
    "float",
    "for",
    "goto",
    "if",
    "int",
    "long",
    "register",
    "return",
    "short",
    "signed",
    "sizeof",
    "static",
    "struct",
    "switch",
    "typedef",
    "union",
    "unsigned",
    "void",
    "volatile",
    "while",
    "class",
    "namespace",
    "try",
    "catch",
    "new",
    "delete",
    "this",
    "template",
    "nullptr",
    "true",
    "false",
    "bool",
    "private",
    "protected",
    "public",
    "virtual",
    "friend",
    "operator",
    "using",
    "throw",
    "include",
    "define",
    "ifdef",
    "ifndef",
    "endif",
    "pragma",
    "std",
    "string",
    "vector",
    "map",
    "set",
    "list",
    "queue",
    "stack",
    "pair",
    "cout",
    "cin",
    "cerr",
    "endl",
  ])

  // Replace identifiers with normalized placeholders
  return line.replace(identifierRegex, (match) => {
    // Don't normalize keywords or common types
    if (cppKeywords.has(match)) {
      return match
    }

    // Check if we've seen this variable before
    if (!variableMap.has(match)) {
      variableMap.set(match, `VAR_${nextVarId++}`)
    }

    return variableMap.get(match)!
  })
}

// Update the createShingles function to be more structure-aware
function createShingles(lines: string[], k: number): Map<string, number[]> {
  const shingles = new Map<string, number[]>()

  if (lines.length < k) return shingles

  for (let i = 0; i <= lines.length - k; i++) {
    // Extract structural elements from the code block
    const codeBlock = lines.slice(i, i + k).join("\n")

    // Create a structure-based fingerprint
    const structureFingerprint = createStructureFingerprint(codeBlock)

    // Hash the structure fingerprint
    const hash = simpleHash(structureFingerprint)

    if (!shingles.has(hash)) {
      shingles.set(hash, [])
    }
    shingles.get(hash)!.push(i)
  }

  return shingles
}

// Add a new function to create a structure-based fingerprint
function createStructureFingerprint(codeBlock: string): string {
  // Replace specific patterns with tokens to capture structure
  let fingerprint = codeBlock

  // Capture control structures
  fingerprint = fingerprint.replace(/\bif\s*$$[^)]*$$/g, "IF_STMT")
  fingerprint = fingerprint.replace(/\bfor\s*$$[^)]*$$/g, "FOR_STMT")
  fingerprint = fingerprint.replace(/\bwhile\s*$$[^)]*$$/g, "WHILE_STMT")
  fingerprint = fingerprint.replace(/\bswitch\s*$$[^)]*$$/g, "SWITCH_STMT")

  // Capture function calls (ignoring arguments)
  fingerprint = fingerprint.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\s*$$[^)]*$$/g, "FUNC_CALL")

  // Capture assignments
  fingerprint = fingerprint.replace(/[^=]=(?!=)[^=]/g, "ASSIGN")

  // Capture arithmetic operations
  fingerprint = fingerprint.replace(/[+\-*/%]/g, "OP")

  // Capture comparisons
  fingerprint = fingerprint.replace(/[<>]=?|==|!=/g, "CMP")

  return fingerprint
}

/**
 * Simple hash function for demonstration
 * In a real implementation, we'd use a more sophisticated hash function
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(16)
}

/**
 * Calculate Jaccard similarity between two sets of shingles
 */
function calculateJaccardSimilarity(
  shingles1: Map<string, number[]>,
  shingles2: Map<string, number[]>,
): { similarity: number; matchedShingles: Array<{ hash: string; positions1: number[]; positions2: number[] }> } {
  const matchedShingles: Array<{ hash: string; positions1: number[]; positions2: number[] }> = []
  let intersection = 0
  const union = new Set<string>()

  // Find intersection and union
  for (const [hash, positions1] of shingles1.entries()) {
    union.add(hash)

    if (shingles2.has(hash)) {
      intersection++
      matchedShingles.push({
        hash,
        positions1,
        positions2: shingles2.get(hash)!,
      })
    }
  }

  // Add remaining hashes from shingles2 to the union
  for (const hash of shingles2.keys()) {
    union.add(hash)
  }

  // Calculate Jaccard similarity
  const similarity = union.size === 0 ? 0 : intersection / union.size

  return { similarity, matchedShingles }
}

/**
 * Convert matched shingles to matched segments
 */
function convertToMatchedSegments(
  matchedShingles: Array<{ hash: string; positions1: number[]; positions2: number[] }>,
  lines1: string[],
  lines2: string[],
  k: number,
): MatchedSegment[] {
  const segments: MatchedSegment[] = []

  for (const { positions1, positions2 } of matchedShingles) {
    for (const pos1 of positions1) {
      for (const pos2 of positions2) {
        segments.push({
          file1Start: pos1,
          file1End: pos1 + k - 1,
          file2Start: pos2,
          file2End: pos2 + k - 1,
          lines: lines1.slice(pos1, pos1 + k),
        })
      }
    }
  }

  // Merge overlapping segments
  return mergeOverlappingSegments(segments)
}

/**
 * Merge overlapping segments
 */
function mergeOverlappingSegments(segments: MatchedSegment[]): MatchedSegment[] {
  if (segments.length <= 1) return segments

  // Sort segments by file1Start
  segments.sort((a, b) => a.file1Start - b.file1Start)

  const mergedSegments: MatchedSegment[] = []
  let currentSegment = segments[0]

  for (let i = 1; i < segments.length; i++) {
    const nextSegment = segments[i]

    // Check if segments overlap
    if (nextSegment.file1Start <= currentSegment.file1End + 1) {
      // Merge segments
      currentSegment = {
        file1Start: currentSegment.file1Start,
        file1End: Math.max(currentSegment.file1End, nextSegment.file1End),
        file2Start: Math.min(currentSegment.file2Start, nextSegment.file2Start),
        file2End: Math.max(currentSegment.file2End, nextSegment.file2End),
        lines: [...new Set([...currentSegment.lines, ...nextSegment.lines])],
      }
    } else {
      // Add current segment to result and move to next
      mergedSegments.push(currentSegment)
      currentSegment = nextSegment
    }
  }

  // Add the last segment
  mergedSegments.push(currentSegment)

  return mergedSegments
}
