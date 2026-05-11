import { generateText, streamText } from "ai"
import { createOpenAI, openai } from "@ai-sdk/openai"
import Logger from "$pkg/logger"

export type SupportedLlmProvider = "openai" | "deepseek"

export type ModelCandidate = {
	provider: SupportedLlmProvider
	modelId: string
	label: string
	model: ReturnType<typeof openai>
}

type GenerateTextInput = Omit<Parameters<typeof generateText>[0], "model">
type StreamTextInput = Omit<Parameters<typeof streamText>[0], "model">

const DEFAULT_MODELS: Record<SupportedLlmProvider, string> = {
	openai: "gpt-4.1-mini",
	deepseek: "deepseek-v4-flash",
}

const deepseek = createOpenAI({
	apiKey: process.env.DEEPSEEK_API_KEY || "",
	baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
})

function normalizeProvider(value: string | undefined): SupportedLlmProvider {
	const normalized = value?.trim().toLowerCase()
	return normalized === "deepseek" ? "deepseek" : "openai"
}

function isProviderConfigured(provider: SupportedLlmProvider): boolean {
	if (provider === "deepseek") {
		return Boolean(process.env.DEEPSEEK_API_KEY)
	}

	return Boolean(process.env.OPENAI_API_KEY)
}

function getProvider(provider: SupportedLlmProvider) {
	return provider === "deepseek" ? deepseek : openai
}

function getConfiguredModelId(
	provider: SupportedLlmProvider,
	position: "primary" | "fallback",
): string {
	const configuredModel =
		position === "primary"
			? process.env.AI_PRIMARY_MODEL
			: process.env.AI_FALLBACK_MODEL

	return configuredModel?.trim() || DEFAULT_MODELS[provider]
}

export function getChatModelCandidates(): ModelCandidate[] {
	const primaryProvider = normalizeProvider(process.env.AI_PRIMARY_PROVIDER)
	const fallbackProvider: SupportedLlmProvider =
		primaryProvider === "openai" ? "deepseek" : "openai"
	const orderedProviders = [primaryProvider, fallbackProvider] as const
	const seen = new Set<string>()
	const candidates: ModelCandidate[] = []

	for (const [index, provider] of orderedProviders.entries()) {
		if (!isProviderConfigured(provider)) continue

		const position = index === 0 ? "primary" : "fallback"
		const modelId = getConfiguredModelId(provider, position)
		const dedupeKey = `${provider}:${modelId}`
		if (seen.has(dedupeKey)) continue

		seen.add(dedupeKey)
		candidates.push({
			provider,
			modelId,
			label: dedupeKey,
			model: getProvider(provider)(modelId),
		})
	}

	return candidates
}

function getErrorStatus(error: unknown): number | undefined {
	if (!error || typeof error !== "object") return undefined

	const candidate = error as {
		status?: unknown
		statusCode?: unknown
		response?: { status?: unknown }
		cause?: { status?: unknown }
	}

	const rawStatus =
		candidate.status ??
		candidate.statusCode ??
		candidate.response?.status ??
		candidate.cause?.status

	return typeof rawStatus === "number" ? rawStatus : undefined
}

function getErrorCode(error: unknown): string | undefined {
	if (!error || typeof error !== "object") return undefined

	const candidate = error as { code?: unknown; cause?: { code?: unknown } }
	const rawCode = candidate.code ?? candidate.cause?.code
	return typeof rawCode === "string" ? rawCode.toUpperCase() : undefined
}

export function isRetryableLlmError(error: unknown): boolean {
	const status = getErrorStatus(error)
	if (
		status !== undefined &&
		[408, 409, 425, 429, 500, 502, 503, 504].includes(status)
	) {
		return true
	}

	const code = getErrorCode(error)
	if (
		code &&
		[
			"ECONNABORTED",
			"ECONNREFUSED",
			"ECONNRESET",
			"EAI_AGAIN",
			"ENETUNREACH",
			"ENOTFOUND",
			"ETIMEDOUT",
		].includes(code)
	) {
		return true
	}

	const message = error instanceof Error ? error.message.toLowerCase() : ""
	return (
		message.includes("timed out") ||
		message.includes("timeout") ||
		message.includes("rate limit") ||
		message.includes("temporarily unavailable") ||
		message.includes("connection reset") ||
		message.includes("network error")
	)
}

type GenerateTextWithFallbackOptions = {
	operation: string
}

export async function generateTextWithFallback(
	input: GenerateTextInput,
	options: GenerateTextWithFallbackOptions,
) {
	const candidates = getChatModelCandidates()

	if (candidates.length === 0) {
		throw new Error(
			"No configured chat model is available. Set OPENAI_API_KEY or DEEPSEEK_API_KEY.",
		)
	}

	let lastError: unknown

	for (const [index, candidate] of candidates.entries()) {
		try {
			Logger.info("llm.generate.attempt", {
				operation: options.operation,
				provider: candidate.provider,
				model: candidate.modelId,
				isFallback: index > 0,
			})

			const result = await generateText({
				...input,
				model: candidate.model,
			} as Parameters<typeof generateText>[0])

			return {
				result,
				candidate,
				usedFallback: index > 0,
			}
		} catch (error) {
			lastError = error
			const shouldRetry =
				index < candidates.length - 1 && isRetryableLlmError(error)

			Logger.error("llm.generate.failed", {
				operation: options.operation,
				provider: candidate.provider,
				model: candidate.modelId,
				isFallback: index > 0,
				shouldRetry,
				error,
			})

			if (!shouldRetry) {
				throw error
			}
		}
	}

	throw lastError instanceof Error
		? lastError
		: new Error("Language model invocation failed.")
}

type StreamTextWithFallbackOptions = {
	operation: string
	preferredCandidate?: ModelCandidate
}

export function streamTextWithFallback(
	input: StreamTextInput,
	options: StreamTextWithFallbackOptions,
) {
	const allCandidates = getChatModelCandidates()
	const candidates = options.preferredCandidate
		? [
				options.preferredCandidate,
				...allCandidates.filter(
					(candidate) => candidate.label !== options.preferredCandidate?.label,
				),
			]
		: allCandidates

	if (candidates.length === 0) {
		throw new Error(
			"No configured chat model is available. Set OPENAI_API_KEY or DEEPSEEK_API_KEY.",
		)
	}

	let lastError: unknown

	for (const [index, candidate] of candidates.entries()) {
		try {
			Logger.info("llm.stream.attempt", {
				operation: options.operation,
				provider: candidate.provider,
				model: candidate.modelId,
				isFallback: index > 0,
			})

			const result = streamText({
				...input,
				model: candidate.model,
			} as Parameters<typeof streamText>[0])

			return {
				result,
				candidate,
				usedFallback: index > 0,
			}
		} catch (error) {
			lastError = error
			const shouldRetry =
				index < candidates.length - 1 && isRetryableLlmError(error)

			Logger.error("llm.stream.failed", {
				operation: options.operation,
				provider: candidate.provider,
				model: candidate.modelId,
				isFallback: index > 0,
				shouldRetry,
				error,
			})

			if (!shouldRetry) {
				throw error
			}
		}
	}

	throw lastError instanceof Error
		? lastError
		: new Error("Language model invocation failed.")
}
