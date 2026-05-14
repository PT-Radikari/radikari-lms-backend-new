/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import {
	computeOverduePending,
	attachOverdueToKnowledgeList,
} from "$utils/knowledgeOverdue.utils"

describe("knowledgeOverdue.utils", () => {
	describe("computeOverduePending", () => {
		const baseDate = new Date("2026-01-01T00:00:00Z")

		it("should return not overdue for non-PENDING status", () => {
			const result = computeOverduePending({
				status: "APPROVED",
				createdAt: baseDate.toISOString(),
				now: baseDate,
			})
			expect(result.isOverduePending).toBe(false)
			expect(result.pendingAgeHours).toBe(0)
		})

		it("should return not overdue when createdAt is null", () => {
			const result = computeOverduePending({
				status: "PENDING",
				createdAt: null,
				now: baseDate,
			})
			expect(result.isOverduePending).toBe(false)
		})

		it("should return not overdue when createdAt is undefined", () => {
			const result = computeOverduePending({
				status: "PENDING",
				now: baseDate,
			})
			expect(result.isOverduePending).toBe(false)
		})

		it("should return not overdue before threshold", () => {
			const createdAt = new Date(baseDate.getTime() - 12 * 60 * 60 * 1000) // 12 hours ago
			const result = computeOverduePending({
				status: "PENDING",
				createdAt: createdAt.toISOString(),
				thresholdHours: 24,
				now: baseDate,
			})
			expect(result.isOverduePending).toBe(false)
			expect(result.pendingAgeHours).toBeGreaterThan(0)
		})

		it("should return overdue after threshold", () => {
			const createdAt = new Date(baseDate.getTime() - 25 * 60 * 60 * 1000) // 25 hours ago
			const result = computeOverduePending({
				status: "PENDING",
				createdAt: createdAt.toISOString(),
				thresholdHours: 24,
				now: baseDate,
			})
			expect(result.isOverduePending).toBe(true)
			expect(result.overdueAt).not.toBeNull()
		})

		it("should handle Date object as createdAt", () => {
			const createdAt = new Date(baseDate.getTime() - 48 * 60 * 60 * 1000)
			const result = computeOverduePending({
				status: "PENDING",
				createdAt,
				thresholdHours: 24,
				now: baseDate,
			})
			expect(result.isOverduePending).toBe(true)
		})

		it("should use default threshold of 24 hours", () => {
			const createdAt = new Date(baseDate.getTime() - 25 * 60 * 60 * 1000)
			const result = computeOverduePending({
				status: "PENDING",
				createdAt: createdAt.toISOString(),
				now: baseDate,
			})
			expect(result.isOverduePending).toBe(true)
		})
	})

	describe("attachOverdueToKnowledgeList", () => {
		const baseDate = new Date("2026-01-01T00:00:00Z")

		it("should patch entries with overdue data", () => {
			const data = {
				totalData: 2,
				entries: [
					{
						id: "1",
						status: "PENDING",
						createdAt: new Date(baseDate.getTime() - 48 * 60 * 60 * 1000).toISOString(),
					},
					{
						id: "2",
						status: "APPROVED",
						createdAt: new Date(baseDate.getTime() - 48 * 60 * 60 * 1000).toISOString(),
					},
				],
			}

			const result = attachOverdueToKnowledgeList(data as any, 24) as any

			expect(result.entries[0].isOverduePending).toBe(true)
			expect(result.entries[1].isOverduePending).toBe(false)
		})

		it("should patch content.entries with overdue data", () => {
			const data = {
				totalData: 1,
				content: {
					entries: [
						{
							id: "1",
							status: "PENDING",
							createdAt: new Date(baseDate.getTime() - 48 * 60 * 60 * 1000).toISOString(),
						},
					],
				},
			}

			const result = attachOverdueToKnowledgeList(data as any, 24) as any

			expect(result.content.entries[0].isOverduePending).toBe(true)
		})

		it("should return data as-is when no entries pattern matches", () => {
			const data = { totalData: 0, items: [] }

			const result = attachOverdueToKnowledgeList(data, 24)

			expect(result).toEqual(data)
		})
	})
})
