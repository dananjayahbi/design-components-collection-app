"use client";

import { WebContainer } from "@webcontainer/api";
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * WebContainers Hook
 * 
 * This hook provides a WebContainer instance for running Node.js code in the browser.
 * Useful for React components sandbox that require a full Node.js environment.
 * 
 * Note: WebContainers require specific headers (COOP/COEP) to be set on the server.
 * For Next.js, you'll need to add these headers in next.config.ts:
 * 
 * headers: async () => [
 *   {
 *     source: '/:path*',
 *     headers: [
 *       { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
 *       { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
 *     ],
 *   },
 * ]
 * 
 * @returns WebContainer instance and loading state
 */
export function useWebContainer() {
  const [webcontainerInstance, setWebcontainerInstance] =
    useState<WebContainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bootingRef = useRef(false);

  useEffect(() => {
    const bootWebContainer = async () => {
      // Prevent multiple boot attempts
      if (bootingRef.current) return;
      bootingRef.current = true;

      try {
        // Check if we're in a browser environment
        if (typeof window === "undefined") {
          throw new Error("WebContainers only work in browser environment");
        }

        // Boot the WebContainer
        const instance = await WebContainer.boot();
        setWebcontainerInstance(instance);
        setIsLoading(false);
      } catch (err) {
        console.error("WebContainer boot error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to boot WebContainer"
        );
        setIsLoading(false);
      }
    };

    bootWebContainer();

    // Cleanup
    return () => {
      if (webcontainerInstance) {
        webcontainerInstance.teardown();
      }
    };
  }, []);

  const writeFile = useCallback(
    async (path: string, content: string) => {
      if (!webcontainerInstance) {
        throw new Error("WebContainer not initialized");
      }
      await webcontainerInstance.fs.writeFile(path, content);
    },
    [webcontainerInstance]
  );

  const readFile = useCallback(
    async (path: string): Promise<string> => {
      if (!webcontainerInstance) {
        throw new Error("WebContainer not initialized");
      }
      return await webcontainerInstance.fs.readFile(path, "utf-8");
    },
    [webcontainerInstance]
  );

  const runCommand = useCallback(
    async (command: string, args: string[] = []) => {
      if (!webcontainerInstance) {
        throw new Error("WebContainer not initialized");
      }
      const process = await webcontainerInstance.spawn(command, args);
      return process;
    },
    [webcontainerInstance]
  );

  return {
    webcontainerInstance,
    isLoading,
    error,
    writeFile,
    readFile,
    runCommand,
  };
}
