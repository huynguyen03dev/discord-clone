"use client";

import { useEffect, useState, FormEvent, useRef } from "react";
import Script from "next/script";
import ReactMarkdown from 'react-markdown';

// Add TypeScript declarations for Puter
declare global {
	interface Window {
		puter: {
			ai: {
				chat: (prompt: string, options: { 
					model: string,
					stream?: boolean 
				}) => Promise<{
					message: { content: string }
				} | AsyncIterable<{ text?: string }>>
			}
		} | undefined;
	}
}

const Page = () => {
	const [explanation, setExplanation] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isStreaming, setIsStreaming] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
	const [prompt, setPrompt] = useState<string>("Explain quantum entanglement in simple terms");
	const [useStreaming, setUseStreaming] = useState<boolean>(true);
	const responseRef = useRef<HTMLDivElement>(null);

	const handlePuterQuery = async (e?: FormEvent) => {
		if (e) e.preventDefault();
		
		if (!isScriptLoaded) {
			setError("Puter script is not loaded yet. Please wait.");
			return;
		}

		setIsLoading(true);
		setError(null);
		setExplanation("");
		
		try {
			if (typeof window !== "undefined" && window.puter) {
				if (useStreaming) {
					setIsStreaming(true);
					const response = await window.puter.ai.chat(
						prompt, 
						{ model: "deepseek-chat", stream: true }
					);
					
					// Handle streaming response
					if (Symbol.asyncIterator in Object(response)) {
						for await (const part of response as AsyncIterable<{ text?: string }>) {
							if (part?.text) {
								setExplanation(prev => prev + part.text);
								
								// Auto-scroll to bottom of response
								if (responseRef.current) {
									responseRef.current.scrollTop = responseRef.current.scrollHeight;
								}
							}
						}
					}
					setIsStreaming(false);
				} else {
					// Handle non-streaming response
					const response = await window.puter.ai.chat(
						prompt, 
						{ model: "deepseek-chat" }
					) as { message: { content: string } };
					setExplanation(response.message.content);
				}
			}
		} catch (err) {
			console.error("Error using Puter AI:", err);
			setError("Failed to load Puter AI response. See console for details.");
		} finally {
			setIsLoading(false);
			setIsStreaming(false);
		}
	};

	// Auto-run the query when script is loaded
	useEffect(() => {
		if (isScriptLoaded) {
			handlePuterQuery();
		}
	}, [isScriptLoaded]);

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
			<div className="max-w-4xl mx-auto px-4">
				<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
					<div className="p-6 md:p-8">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">Puter AI Assistant</h1>
						<p className="text-gray-600 dark:text-gray-300 mb-6">Ask anything and get intelligent responses</p>
						
						{/* Load the Puter script */}
						<Script 
							src="https://js.puter.com/v2/" 
							onLoad={() => {
								console.log("Puter script loaded");
								setIsScriptLoaded(true);
							}}
							onError={() => {
								setError("Failed to load Puter script");
								setIsLoading(false);
							}}
						/>
						
						<form onSubmit={handlePuterQuery} className="mb-8">
							<div className="flex flex-col space-y-3">
								<label htmlFor="prompt" className="font-medium text-gray-700 dark:text-gray-200">
									Your question:
								</label>
								<textarea
									id="prompt"
									value={prompt}
									onChange={(e) => setPrompt(e.target.value)}
									className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 min-h-[120px] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
									placeholder="Enter your question here..."
								/>
								<div className="flex items-center space-x-2 mb-2">
									<input
										type="checkbox"
										id="streaming"
										checked={useStreaming}
										onChange={() => setUseStreaming(!useStreaming)}
										className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
									/>
									<label htmlFor="streaming" className="text-sm text-gray-700 dark:text-gray-300">
										Enable streaming response
									</label>
								</div>
								<button
									type="submit"
									disabled={isLoading || isStreaming || !isScriptLoaded}
									className={`px-5 py-3 rounded-lg font-medium transition-all ${
										isLoading || isStreaming || !isScriptLoaded
											? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
											: "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
									}`}
								>
									{isLoading || isStreaming ? (
										<span className="flex items-center justify-center">
											<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											{isStreaming ? "Receiving..." : "Processing..."}
										</span>
									) : "Get Answer"}
								</button>
							</div>
						</form>
						
						{!isScriptLoaded && !error && (
							<div className="flex items-center justify-center p-6 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg mb-6">
								<svg className="animate-spin h-5 w-5 mr-3 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								<p className="text-yellow-700 dark:text-yellow-300">Loading Puter AI script...</p>
							</div>
						)}
						
						{error && (
							<div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg mb-6">
								<p className="text-red-600 dark:text-red-300">{error}</p>
							</div>
						)}
						
						{(explanation || isStreaming) && (
							<div className="mt-8 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
								<div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
									<h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Response</h2>
									{isStreaming && (
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
											<span className="relative flex h-2 w-2 mr-1">
												<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
												<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
											</span>
											Streaming
										</span>
									)}
								</div>
								<div 
									className="p-6 bg-white dark:bg-gray-800 overflow-y-auto max-h-[500px] transition-all duration-200" 
									ref={responseRef}
								>
									<div className="prose dark:prose-invert max-w-none">
										<ReactMarkdown>
											{explanation || "Waiting for response..."}
										</ReactMarkdown>
									</div>
									{isStreaming && (
										<span className="inline-block w-1 h-5 ml-1 bg-black dark:bg-white animate-pulse" />
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Page;