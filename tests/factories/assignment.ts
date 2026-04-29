/* eslint-disable @typescript-eslint/no-explicit-any */
import { Roles } from "$generated/prisma/client"

export const mockUserJWT = {
	id: "user-test-123",
	email: "test@example.com",
	fullName: "Test User",
	role: Roles.USER,
	phoneNumber: "08123456789",
	tenantId: "tenant-test-123",
} as any

export const mockUserJWTTeacher = {
	...mockUserJWT,
	id: "teacher-test-123",
	fullName: "Test Teacher",
	role: Roles.ADMIN,
} as any

export const mockUserJWTAdmin = {
	...mockUserJWT,
	id: "admin-test-123",
	fullName: "Test Admin",
	role: Roles.ADMIN,
} as any

export const mockAssignment = {
	id: "assign-test-123",
	title: "Test Assignment",
	description: "Test Description",
	durationInMinutes: 60,
	tenantId: "tenant-test-123",
	createdByUserId: "teacher-test-123",
	expiredDate: new Date(Date.now() + 86400000).toISOString(),
	access: "TENANT_ROLE" as const,
	status: "DRAFT" as const,
	isRandomized: false,
	showQuestion: true,
	showAnswer: true,
} as any

export const mockAssignmentPublished = {
	...mockAssignment,
	status: "PUBLISHED" as const,
} as any

export const mockAssignmentAttempt = {
	id: "attempt-test-123",
	assignmentId: "assign-test-123",
	userId: "user-test-123",
	isSubmitted: false,
	score: null,
	percentageScore: null,
	createdAt: new Date(),
	submittedAt: null,
} as any
