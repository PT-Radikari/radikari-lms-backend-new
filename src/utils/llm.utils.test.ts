import { beforeEach, describe, expect, it, mock } from "bun:test"

const mockLoggerInfo = mock(() => {})
const mockLoggerError = mock(() => {})

mock.module("ai", () => ({
	generateText: mock(() => Promise.resolve({ text: "ok" })),
	streamText: mock(() => ({
		toUIMessageStream: () => new ReadableStream(),
	})),
}))

mock.module("@ai-sdk/openai", () => {
	const buildModel = (provider: string) => (modelId: string) => ({
		provider,
		modelId,
	})

	return {
		openai: buildModel("openai"),
		createOpenAI: () => buildModel("deepseek"),
	}
})

mock.module("$pkg/logger", () => ({
	default: {
		info: mockLoggerInfo,
		error: mockLoggerError,
	},
}))

const { getChatModelCandidates, isRetryableLlmError } = await import(
	"./llm.utils"
)

describe("llm.utils", () => {
	beforeEach(() => {
		mockLoggerInfo.mockClear()
		mockLoggerError.mockClear()

		delete process.env.OPENAI_API_KEY
		delete process.env.DEEPSEEK_API_KEY
		delete process.env.AI_PRIMARY_PROVIDER
		delete process.env.AI_PRIMARY_MODEL
		delete process.env.AI_FALLBACK_MODEL
	})

	it("prefers OpenAI and keeps DeepSeek as fallback by default", () => {
		process.env.OPENAI_API_KEY = "openai-key"
		process.env.DEEPSEEK_API_KEY = "deepseek-key"

		const candidates = getChatModelCandidates()

		expect(candidates.map((candidate) => candidate.label)).toEqual([
			"openai:gpt-4.1-mini",
			"deepseek:deepseek-v4-flash",
		])
	})

	it("skips unconfigured providers", () => {
		process.env.DEEPSEEK_API_KEY = "deepseek-key"

		const candidates = getChatModelCandidates()

		expect(candidates.map((candidate) => candidate.label)).toEqual([
			"deepseek:deepseek-v4-flash",
		])
	})

	it("treats rate limit and timeout failures as retryable", () => {
		expect(isRetryableLlmError({ status: 429 })).toBe(true)
		expect(isRetryableLlmError({ code: "ETIMEDOUT" })).toBe(true)
		expect(isRetryableLlmError(new Error("network error"))).toBe(true)
		expect(isRetryableLlmError({ status: 401 })).toBe(false)
	})
})
