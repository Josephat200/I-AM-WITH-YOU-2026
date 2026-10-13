import { pgTable, text, serial, timestamp, boolean, numeric, integer, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// 1. Users Table
export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // 'Applicant / Beneficiary', 'Parent / Guardian', 'Sponsor / Funding Organization', 'Reviewer / Selection Committee', 'Secretary', 'Admin', 'Super Admin'
  phone: text("phone"),
  organization: text("organization"),
  status: text("status").default("Active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Sessions Table
export const sessionsTable = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  loginTime: timestamp("login_time", { withTimezone: true }).defaultNow().notNull(),
  logoutTime: timestamp("logout_time", { withTimezone: true }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceLabel: text("device_label"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Audit Logs Table
export const auditLogsTable = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  actorName: text("actor_name").notNull(),
  role: text("role").notNull(),
  action: text("action").notNull(),
  eventType: text("event_type").notNull(),
  details: jsonb("details").default({}),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Students Table
export const studentsTable = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  studentIdCode: text("student_id_code").notNull().unique(),
  school: text("school").notNull(),
  grade: text("grade").notNull(),
  county: text("county").default("Nairobi"),
  guardianName: text("guardian_name"),
  guardianPhone: text("guardian_phone"),
  guardianEmail: text("guardian_email"),
  photoUrl: text("photo_url"),
  idCardStatus: text("id_card_status").default("Draft").notNull(),
  idCardIssuedAt: timestamp("id_card_issued_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5. Student Documents Table
export const studentDocumentsTable = pgTable("student_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").references(() => studentsTable.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  verificationStatus: text("verification_status").default("Received").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. Sponsors Table
export const sponsorsTable = pgTable("sponsors", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  organizationName: text("organization_name").notNull().unique(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  website: text("website"),
  verificationStatus: text("verification_status").default("In review").notNull(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 7. Opportunities Table
export const opportunitiesTable = pgTable("opportunities", {
  id: uuid("id").defaultRandom().primaryKey(),
  sponsorId: uuid("sponsor_id").references(() => sponsorsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sponsorName: text("sponsor_name").notNull(),
  amount: numeric("amount").notNull(),
  deadline: text("deadline").notNull(),
  status: text("status").default("Open").notNull(),
  description: text("description").notNull(),
  criteria: jsonb("criteria").default([]),
  fundedCount: integer("funded_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 8. Applications Table
export const applicationsTable = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  opportunityId: uuid("opportunity_id").references(() => opportunitiesTable.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").references(() => studentsTable.id, { onDelete: "cascade" }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  status: text("status").default("Ready for review").notNull(),
  overallScore: numeric("overall_score").default("0"),
  recommendation: text("recommendation").default("Pending").notNull(),
  awardNotes: text("award_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 9. Reviews Table
export const reviewsTable = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").references(() => applicationsTable.id, { onDelete: "cascade" }),
  reviewerId: uuid("reviewer_id").references(() => usersTable.id, { onDelete: "cascade" }),
  scoreAcademics: integer("score_academics"),
  scoreNeed: integer("score_need"),
  scoreCommunity: integer("score_community"),
  scoreReadiness: integer("score_readiness"),
  totalScore: integer("total_score"),
  recommendation: text("recommendation").notNull(),
  reviewerNotes: text("reviewer_notes"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }).defaultNow().notNull(),
});

// 10. Messages Table
export const messagesTable = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  senderId: uuid("sender_id").references(() => usersTable.id, { onDelete: "set null" }),
  senderName: text("sender_name").notNull(),
  audience: text("audience").notNull(),
  recipientId: uuid("recipient_id").references(() => usersTable.id, { onDelete: "set null" }),
  channel: text("channel").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").default("Delivered").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
});

// Types & Schemas
export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
export type Student = typeof studentsTable.$inferSelect;
export type Opportunity = typeof opportunitiesTable.$inferSelect;
export type Application = typeof applicationsTable.$inferSelect;
export type Review = typeof reviewsTable.$inferSelect;
export type Message = typeof messagesTable.$inferSelect;
export type AuditLog = typeof auditLogsTable.$inferSelect;
export type Session = typeof sessionsTable.$inferSelect;