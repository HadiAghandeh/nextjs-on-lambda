import React from 'react';

function isPrime(num: number): boolean {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  
  // Checking divisibility by 6k ± 1
  for (let i = 5; i * i <= num; i = i + 6) {
    if (num % i === 0 || num % (i + 2) === 0) {
      return false;
    }
  }

  return true;
}

function findPrimesSync(start: number, end: number): number[] {
  const primes: number[] = [];
  for (let i = start; i <= end; i++) {
    if (isPrime(i)) {
      primes.push(i);
    }
  }
  return primes;
}




export default async function ServerPerformanceTest() {
  const PRIME_RANGE_START = 1;
  const PRIME_RANGE_END = 10_000_000; 

  const startTime = Date.now();

  const primeNumbers = findPrimesSync(PRIME_RANGE_START, PRIME_RANGE_END);
  
  const endTime = Date.now();

  const primeCount = primeNumbers.length;
  const largestPrime = primeCount > 0 ? primeNumbers[primeCount - 1] : null;
  const totalDuration = endTime - startTime;
  
  const durationColor = totalDuration > 1500 ? 'text-red-500' : 
                        totalDuration > 500 ? 'text-yellow-600' : 'text-green-600';

//   console.log(`
// --- Next.js Server Performance Test Results ---
// [CPU-INTENSIVE TASK]: findPrimesSync(${PRIME_RANGE_START}, ${PRIME_RANGE_END})
// [FOUND PRIMES]: ${primeCount.toLocaleString()}
// [TOTAL SSR DURATION]: ${totalDuration}ms
// -----------------------------------------------
//   `);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-3xl w-full bg-white shadow-2xl rounded-xl p-8 lg:p-12 border-t-4 border-indigo-600">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            NEXTJS+AMPLIFY CPU-Intensive Server Rendering Test 💡
          </h1>
          <p className="text-lg text-indigo-600">
            Next.js Server Component running a synchronous, blocking task.
          </p>
        </header>

        <section className="space-y-6">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h2 className="text-xl font-bold text-red-700 mb-2">
                ⚠️ Blocking CPU Workload
            </h2>
            <p className="text-red-600">
                The servers main thread was blocked to find primes from 
                <span className="font-mono text-lg mx-2">{PRIME_RANGE_START.toLocaleString()}</span> to 
                <span className="font-mono text-lg mx-2">{PRIME_RANGE_END.toLocaleString()}</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            
            {/* Metric 1: Total Duration */}
            <div className="p-4 bg-indigo-100 rounded-lg shadow-md">
              <p className="text-sm font-medium text-indigo-700 uppercase">
                SSR Latency (Total Block Time)
              </p>
              <p className={`text-4xl font-extrabold mt-1 ${durationColor}`}>
                {totalDuration.toLocaleString()}
                <span className="text-xl font-semibold ml-1">ms</span>
              </p>
            </div>

            {/* Metric 2: Primes Found */}
            <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
              <p className="text-sm font-medium text-gray-500 uppercase">
                Primes Calculated
              </p>
              <p className="text-4xl font-extrabold text-gray-900 mt-1">
                {primeCount.toLocaleString()}
              </p>
            </div>

            {/* Metric 3: Largest Prime */}
            <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
              <p className="text-sm font-medium text-gray-500 uppercase">
                Largest Prime
              </p>
              <p className="text-4xl font-extrabold text-gray-900 mt-1">
                {largestPrime ? largestPrime.toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-500 italic">
          <p>
            This entire content, including the heavy calculation, was executed on the server 
            before being sent as complete HTML to the browser.
          </p>
        </footer>
      </div>
    </div>
  );
}