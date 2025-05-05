# CodePlag - Algorithm Implementation Details

## Plagiarism Detection Pipeline

### 1. Code Preprocessing Algorithm

```pseudocode
function preprocessCode(sourceCode):
    tokens = tokenize(sourceCode)
    normalizedTokens = []
    
    // Symbol table for variable/function name normalization
    symbolTable = new Map()
    
    for each token in tokens:
        if isIdentifier(token):
            if token not in symbolTable:
                symbolTable[token] = generateNormalizedName(symbolTable.size)
            normalizedTokens.append(symbolTable[token])
        else:
            normalizedTokens.append(token)
    
    return normalizedTokens
```

### 2. K-Shingles Generation

```pseudocode
function generateShingles(tokens, k):
    shingles = new Set()
    
    // Rolling hash implementation
    h = 0
    p = 31  // prime base
    m = 1e9 + 9  // modulo for hash
    
    // Precompute powers
    pPow = new Array(k)
    pPow[0] = 1
    for i from 1 to k-1:
        pPow[i] = (pPow[i-1] * p) % m
    
    // Generate k-shingles using rolling hash
    window = tokens.slice(0, k)
    for i from 0 to k-1:
        h = (h + tokens[i].hashCode() * pPow[k-1-i]) % m
    shingles.add(h)
    
    // Roll the window
    for i from k to tokens.length-1:
        h = ((h - tokens[i-k].hashCode() * pPow[k-1]) * p + 
             tokens[i].hashCode()) % m
        if h < 0: h += m
        shingles.add(h)
    
    return shingles
```

### 3. MinHash Implementation

```pseudocode
class MinHasher:
    constructor(numPermutations):
        this.numPermutations = numPermutations
        this.hashCoefficients = generateHashCoefficients(numPermutations)
    
    function generateHashCoefficients(n):
        coefficients = []
        for i from 1 to n:
            a = generatePrime()
            b = generatePrime()
            coefficients.append((a, b))
        return coefficients
    
    function computeSignature(shingles):
        signature = new Array(this.numPermutations).fill(Infinity)
        
        for shingle in shingles:
            for i from 0 to this.numPermutations-1:
                (a, b) = this.hashCoefficients[i]
                hashValue = ((a * shingle + b) % LARGE_PRIME)
                signature[i] = min(signature[i], hashValue)
        
        return signature
```

### 4. LSH (Locality-Sensitive Hashing)

```pseudocode
class LSHIndex:
    constructor(numBands, numRows):
        this.numBands = numBands
        this.numRows = numRows
        this.hashTables = Array(numBands).fill(new HashMap())
    
    function insert(documentId, signature):
        for bandIndex from 0 to numBands-1:
            start = bandIndex * numRows
            end = start + numRows
            bandSignature = signature.slice(start, end)
            bandHash = computeBandHash(bandSignature)
            
            if bandHash not in hashTables[bandIndex]:
                hashTables[bandIndex][bandHash] = new Set()
            hashTables[bandIndex][bandHash].add(documentId)
    
    function findCandidatePairs(signature):
        candidates = new Set()
        
        for bandIndex from 0 to numBands-1:
            start = bandIndex * numRows
            end = start + numRows
            bandSignature = signature.slice(start, end)
            bandHash = computeBandHash(bandSignature)
            
            if bandHash in hashTables[bandIndex]:
                candidates.addAll(hashTables[bandIndex][bandHash])
        
        return candidates
```

### 5. Bloom Filter Implementation

```pseudocode
class BloomFilter:
    constructor(size, numHashes):
        this.size = size
        this.numHashes = numHashes
        this.bits = new BitArray(size)
        this.hashFunctions = generateHashFunctions(numHashes)
    
    function add(element):
        for hashFunc in hashFunctions:
            index = hashFunc(element) % size
            bits.set(index, 1)
    
    function mightContain(element):
        for hashFunc in hashFunctions:
            index = hashFunc(element) % size
            if not bits.get(index):
                return false
        return true
```

### 6. Similarity Score Calculation

```pseudocode
function calculateSimilarityScores(doc1, doc2):
    // Jaccard similarity for shingles
    shingleSimilarity = calculateJaccardSimilarity(
        doc1.shingles, 
        doc2.shingles
    )
    
    // Structure similarity using AST
    structureSimilarity = calculateASTSimilarity(
        doc1.ast, 
        doc2.ast
    )
    
    // Token sequence similarity
    tokenSimilarity = calculateLCSSimilarity(
        doc1.tokens, 
        doc2.tokens
    )
    
    // Weighted combination
    return {
        overall: 0.4 * shingleSimilarity + 
                0.4 * structureSimilarity + 
                0.2 * tokenSimilarity,
        details: {
            shingle: shingleSimilarity,
            structure: structureSimilarity,
            token: tokenSimilarity
        }
    }
```

## Optimization Techniques

### 1. Memory-Efficient Shingle Storage

```pseudocode
class CompressedShingleSet:
    constructor():
        this.shingles = new BitSet()
        this.count = 0
    
    function add(shingle):
        index = hashShingle(shingle)
        if not this.shingles.get(index):
            this.shingles.set(index)
            this.count++
```

### 2. Parallel Processing Implementation

```pseudocode
async function processDocumentBatch(documents):
    // Split documents into chunks for parallel processing
    chunks = splitIntoChunks(documents, CHUNK_SIZE)
    
    // Process chunks in parallel
    promises = chunks.map(chunk => 
        Promise.all(chunk.map(doc => processDocument(doc)))
    )
    
    // Combine results
    results = await Promise.all(promises)
    return flattenResults(results)
```

## Performance Benchmarks

| Operation          | Time Complexity | Space Complexity | Typical Runtime |
|-------------------|-----------------|------------------|-----------------|
| Preprocessing     | O(n)           | O(n)            | ~0.1ms/KB      |
| Shingle Gen      | O(n)           | O(k)            | ~0.2ms/KB      |
| MinHash          | O(nh)          | O(h)            | ~1ms/KB        |
| LSH              | O(b)           | O(nb)           | ~0.5ms/doc     |
| Similarity Calc   | O(m)           | O(1)            | ~0.3ms/pair    |

Where:
- n = document size
- h = number of hash functions
- b = number of bands
- k = shingle size
- m = signature size