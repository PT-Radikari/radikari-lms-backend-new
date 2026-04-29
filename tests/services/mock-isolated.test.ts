/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeAll } from "@jest/globals"

let mockKnowledgeRepo: any

jest.mock("./fake-module", () => {
	const mockFn = () => jest.fn<any>()
	return {
		getById: mockFn(),
		create: mockFn(),
		createMany: mockFn(),
		createManyContent: mockFn(),
		createManyAttachments: mockFn(),
		getByIds: mockFn(),
	}
})

beforeAll(() => {
	mockKnowledgeRepo = jest.requireMock("./fake-module")
	console.log("beforeAll: mockKnowledgeRepo =", mockKnowledgeRepo)
	console.log("beforeAll: typeof mockKnowledgeRepo.createMany =", typeof mockKnowledgeRepo.createMany)
})

describe("mock behavior", () => {
	it("test 1", () => {
		console.log("TEST1: mockKnowledgeRepo =", mockKnowledgeRepo)
		console.log("TEST1: typeof createMany =", typeof mockKnowledgeRepo.createMany)
		console.log("TEST1: createMany.mockResolvedValueOnce =", typeof (mockKnowledgeRepo.createMany as any).mockResolvedValueOnce)
		;(mockKnowledgeRepo as any).createMany.mockResolvedValueOnce("value")
		expect((mockKnowledgeRepo as any).createMany()).toBe("value")
	})
})
