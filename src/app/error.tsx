"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import NotFound from "./not-found";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  // If Next.js signaled a 404 via its special digest, render our NotFound UI
  if (error.digest === "NEXT_NOT_FOUND") {
    return <NotFound />;
  }

  // Fallback for custom errors that encode 404 in the message
  if (error.message.includes("404")) {
    return <NotFound />;
  }

  return (
    <div>
      <h2>Something went wrong!</h2>
    </div>
  );
}
