/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import {
	AssignmentSchema,
	AssignmentQuestionSchema,
	AssignmentQuestionOptionSchema,
	AssignmentQuestionTrueFalseAnswerSchema,
	AssignmentQuestionEssayReferenceAnswerSchema,
	AssignmentUserAttemptAnswerSchema,
} from "$validations/schema/AssignmentSchema"
import { AssignmentAccess, AssignmentQuestionType } from "$generated/prisma/client"

describe("Assignment schemas", () => {
	describe("AssignmentSchema", () => {
		it("should pass with valid assignment data", () => {
			const result = AssignmentSchema.safeParse({
				title: "Midterm Exam",
				durationInMinutes: 60,
				expiredDate: "2026-12-31T23:59:59Z",
				access: AssignmentAccess.TENANT_ROLE,
			})
			expect(result.success).toBe(true)
		})

		it("should pass with optional boolean fields", () => {
			const result = AssignmentSchema.safeParse({
				title: "Midterm Exam",
				durationInMinutes: 60,
				expiredDate: "2026-12-31T23:59:59Z",
				access: AssignmentAccess.USER,
				isRandomized: true,
				showQuestion: true,
				showAnswer: false,
			})
			expect(result.success).toBe(true)
		})

		it("should fail when title is missing", () => {
			const result = AssignmentSchema.safeParse({
				durationInMinutes: 60,
				expiredDate: "2026-12-31T23:59:59Z",
				access: AssignmentAccess.TENANT_ROLE,
			})
			expect(result.success).toBe(false)
		})

		it("should fail when durationInMinutes is missing", () => {
			const result = AssignmentSchema.safeParse({
				title: "Midterm Exam",
				expiredDate: "2026-12-31T23:59:59Z",
				access: AssignmentAccess.TENANT_ROLE,
			})
			expect(result.success).toBe(false)
		})

		it("should fail with extra fields", () => {
			const result = AssignmentSchema.safeParse({
				title: "Midterm Exam",
				durationInMinutes: 60,
				expiredDate: "2026-12-31T23:59:59Z",
				access: AssignmentAccess.TENANT_ROLE,
				extra: "not allowed",
			})
			expect(result.success).toBe(false)
		})
	})

	describe("AssignmentQuestionSchema", () => {
		it("should pass with valid question data", () => {
			const result = AssignmentQuestionSchema.safeParse({
				content: "What is 2+2?",
				points: 10,
				type: AssignmentQuestionType.MULTIPLE_CHOICE,
				order: 1,
			})
			expect(result.success).toBe(true)
		})

		it("should pass with optional id", () => {
			const result = AssignmentQuestionSchema.safeParse({
				id: "q-123",
				content: "What is 2+2?",
				points: 10,
				type: AssignmentQuestionType.MULTIPLE_CHOICE,
				order: 1,
			})
			expect(result.success).toBe(true)
		})

		it("should fail when content is missing", () => {
			const result = AssignmentQuestionSchema.safeParse({
				points: 10,
				type: AssignmentQuestionType.MULTIPLE_CHOICE,
				order: 1,
			})
			expect(result.success).toBe(false)
		})

		it("should fail when type is missing", () => {
			const result = AssignmentQuestionSchema.safeParse({
				content: "What is 2+2?",
				points: 10,
				order: 1,
			})
			expect(result.success).toBe(false)
		})
	})

	describe("AssignmentQuestionOptionSchema", () => {
		it("should pass with valid options", () => {
			const result = AssignmentQuestionOptionSchema.safeParse([
				{ content: "Option A", isCorrectAnswer: true },
				{ content: "Option B", isCorrectAnswer: false },
			])
			expect(result.success).toBe(true)
		})

		it("should fail when content is missing", () => {
			const result = AssignmentQuestionOptionSchema.safeParse([
				{ isCorrectAnswer: true },
			])
			expect(result.success).toBe(false)
		})
	})

	describe("AssignmentQuestionTrueFalseAnswerSchema", () => {
		it("should pass with true answer", () => {
			const result = AssignmentQuestionTrueFalseAnswerSchema.safeParse({
				correctAnswer: true,
			})
			expect(result.success).toBe(true)
		})

		it("should pass with false answer", () => {
			const result = AssignmentQuestionTrueFalseAnswerSchema.safeParse({
				correctAnswer: false,
			})
			expect(result.success).toBe(true)
		})
	})

	describe("AssignmentQuestionEssayReferenceAnswerSchema", () => {
		it("should pass with content", () => {
			const result = AssignmentQuestionEssayReferenceAnswerSchema.safeParse({
				content: "Sample essay answer",
			})
			expect(result.success).toBe(true)
		})
	})

	describe("AssignmentUserAttemptAnswerSchema", () => {
		it("should pass with optionAnswerId", () => {
			const result = AssignmentUserAttemptAnswerSchema.safeParse({
				assignmentQuestionId: "q-123",
				optionAnswerId: "opt-a",
			})
			expect(result.success).toBe(true)
		})

		it("should pass with essayAnswer", () => {
			const result = AssignmentUserAttemptAnswerSchema.safeParse({
				assignmentQuestionId: "q-123",
				essayAnswer: "This is my essay answer",
			})
			expect(result.success).toBe(true)
		})

		it("should pass with trueFalseAnswer", () => {
			const result = AssignmentUserAttemptAnswerSchema.safeParse({
				assignmentQuestionId: "q-123",
				trueFalseAnswer: true,
			})
			expect(result.success).toBe(true)
		})

		it("should fail when assignmentQuestionId is missing", () => {
			const result = AssignmentUserAttemptAnswerSchema.safeParse({
				optionAnswerId: "opt-a",
			})
			expect(result.success).toBe(false)
		})
	})
})
