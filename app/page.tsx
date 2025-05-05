import PlagiarismChecker from "@/components/plagiarism-checker"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-16 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full blur-lg opacity-75"></div>
              <div className="relative bg-slate-900 rounded-full p-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-10 h-10 text-white"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 leading-[1.3] pb-1">
  CodePlag
</h1>

          <p className="text-xl text-slate-300 max-w-1.8xl mx-auto">
            Advanced C++ code plagiarism detection powered by intelligent algorithms
          </p>
        </header>

        <PlagiarismChecker />
      </div>
    </main>
  )
}
