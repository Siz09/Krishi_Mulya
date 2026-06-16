import Link from "next/link";
import { Sprout, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-leaf-50 text-leaf-600 mb-6 border border-leaf-100 shadow-sm animate-bounce">
        <Sprout className="h-8 w-8 text-leaf-600 fill-leaf-600/20" />
      </div>
      
      <h1 className="text-4xl font-extrabold text-soil-800 tracking-tight sm:text-5xl">
        404 — Page Not Found
      </h1>
      
      <p className="mt-4 text-base text-soil-800/60 max-w-md mx-auto">
        Sorry, we couldn't find the page or commodity you are looking for. It might have been moved or doesn't exist.
      </p>

      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-leaf-600 text-white rounded-xl font-bold hover:bg-leaf-700 transition-colors shadow-interactive cursor-pointer text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Homepage</span>
        </Link>
      </div>
    </div>
  );
}
