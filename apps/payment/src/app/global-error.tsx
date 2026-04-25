"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 p-8">
        <div className="flex max-w-md flex-col items-center gap-8 rounded-2xl bg-white p-10 text-center shadow">
          <p className="text-2xl font-semibold">Something went wrong</p>
          <p className="text-neutral-500">{error.message}</p>
          <button
            onClick={reset}
            className="rounded-xl bg-black px-6 py-3 text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
