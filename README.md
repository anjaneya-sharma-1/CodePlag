# CodePlag - Advanced C++ Code Plagiarism Detector

[![Next.js](https://img.shields.io/badge/Next.js-13.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38B2AC)](https://tailwindcss.com/)

CodePlag is an advanced C++ code plagiarism detection system that uses a combination of sophisticated algorithms including Shingling, MinHashing, and Jaccard Similarity to detect similarities between code submissions.
![image](https://github.com/user-attachments/assets/d54090e7-0920-40dd-bb10-aac49c354c02)
![image](https://github.com/user-attachments/assets/23e0de63-9359-4073-bfd2-952217baa7ce)

## Features

- 📝 Upload and compare multiple C++ source files
- 🔍 Advanced plagiarism detection using multiple algorithms
- 📊 Visual similarity comparison and detailed reports
- 🎯 Highly accurate detection with minimal false positives
- 💻 Modern, responsive web interface
- 🌙 Dark/Light theme support

## Technical Implementation

### Core Algorithms

#### 1. Code Preprocessing

Before applying similarity detection algorithms, the code goes through several preprocessing steps:

1. **Tokenization**
   - Converts source code into tokens
   - Removes comments, whitespace, and formatting
   - Normalizes variable names and string literals

2. **AST (Abstract Syntax Tree) Generation**
   - Parses the code into an AST representation
   - Captures structural similarities regardless of formatting
   - Enables detection of renamed variables and functions

#### 2. K-Shingling

The k-shingling algorithm breaks down the preprocessed code into overlapping k-length sequences:

```cpp
// Example of k-shingling with k=5
Original: int main() { return 0; }
Shingles: 
- "int m"
- "nt ma"
- "t mai"
- " main"
- "main("
...
```

Implementation characteristics:
- Uses rolling hash for efficient shingle generation
- Optimal k-value determined through empirical testing
- Time Complexity: O(n) where n is code length

#### 3. MinHashing

MinHash algorithm reduces the dimensionality of shingle sets while preserving similarity:

1. **Hash Generation**
   - Applies multiple hash functions to each shingle
   - Typically uses 100-200 hash functions
   - Uses consistent hashing for reproducibility

2. **Signature Matrix**
   - Creates compressed representation of document
   - Maintains similarity properties
   - Reduces space complexity significantly

Time Complexity: O(nh) where n is number of shingles and h is number of hash functions

#### 4. Locality-Sensitive Hashing (LSH)

LSH is used to efficiently find candidate pairs for detailed comparison:

- Divides signature matrix into bands
- Uses multiple hash tables to improve accuracy
- Reduces comparison complexity from O(n²) to O(n)

#### 5. Jaccard Similarity Calculation

Final similarity score is computed using Jaccard similarity:

```
J(A,B) = |A ∩ B| / |A ∪ B|
```

Where A and B are the sets of shingles from two documents.

### Performance Optimizations

1. **Parallel Processing**
   - Multi-threaded shingle generation
   - Concurrent hash computations
   - Distributed LSH when available

2. **Memory Management**
   - Efficient shingle storage using bit arrays
   - Stream processing for large files
   - Memory-mapped file operations

3. **Cache Optimization**
   - LRU cache for frequent comparisons
   - Memoization of hash values
   - Optimized data structures for locality

### Data Structures

1. **Bloom Filters**
   - Used for quick similarity checking
   - Reduces false positives
   - Space-efficient set representation

2. **Min-Heap**
   - Maintains top-k similar documents
   - Efficient updates during processing
   - O(log n) insertion and deletion

3. **Trie**
   - Efficient storage of common code patterns
   - Quick prefix matching
   - Reduces memory usage for similar code segments

## Time Complexity Analysis

Overall system complexity breakdown:

1. Preprocessing: O(n)
2. Shingling: O(n)
3. MinHashing: O(nh)
4. LSH: O(b * r) where b = bands, r = rows per band
5. Jaccard Similarity: O(m) where m = signature size

Total complexity: O(n + nh + b*r + m)

## Space Complexity Analysis

- Document Storage: O(n)
- Signature Matrix: O(n * h)
- LSH Tables: O(n * b)
- Working Memory: O(k) where k = batch size

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/CodePlag.git

# Install dependencies
npm install

# Start development server
npm run dev
```

## Environment Setup

```bash
# Required environment variables
NEXT_PUBLIC_API_URL=your_api_url
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

Built with:
- Next.js 13 App Router
- TypeScript
- TailwindCSS
- shadcn/ui Components
