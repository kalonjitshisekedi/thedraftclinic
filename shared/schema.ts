import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const serviceTypeEnum = pgEnum('service_type', ['proofreading', 'editing', 'formatting']);
export const turnaroundEnum = pgEnum('turnaround', ['24h', '48h', '72h', '1week']);
export const jobStatusEnum = pgEnum('job_status', [
  'draft',
  'quoted',
  'pending_payment',
  'paid',
  'assigned',
  'in_review',
  'revision_requested',
  'completed',
  'cancelled',
  'disputed'
]);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'processing', 'completed', 'failed', 'refunded']);
export const currencyEnum = pgEnum('currency', ['ZAR', 'USD', 'EUR', 'GBP']);
export const userRoleEnum = pgEnum('user_role', ['customer', 'reviewer', 'admin']);

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('customer').notNull(),
  phone: varchar("phone"),
  company: varchar("company"),
  preferredCurrency: currencyEnum("preferred_currency").default('ZAR'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_users_email").on(table.email),
  index("IDX_users_role").on(table.role),
]);

// Reviewer profiles
export const reviewerProfiles = pgTable("reviewer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  specializations: text("specializations").array(),
  yearsExperience: integer("years_experience").default(0),
  bio: text("bio"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default('5.00'),
  completedJobs: integer("completed_jobs").default(0),
  isAvailable: boolean("is_available").default(true),
  maxConcurrentJobs: integer("max_concurrent_jobs").default(5),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_reviewer_user").on(table.userId),
  index("IDX_reviewer_available").on(table.isAvailable),
]);

// Jobs table
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  reviewerId: varchar("reviewer_id").references(() => users.id),
  serviceType: serviceTypeEnum("service_type").notNull(),
  turnaround: turnaroundEnum("turnaround").notNull(),
  status: jobStatusEnum("status").default('draft').notNull(),
  title: varchar("title"),
  instructions: text("instructions"),
  wordCount: integer("word_count").default(0),
  deadline: timestamp("deadline"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_jobs_customer").on(table.customerId),
  index("IDX_jobs_reviewer").on(table.reviewerId),
  index("IDX_jobs_status").on(table.status),
  index("IDX_jobs_created").on(table.createdAt),
]);

// Job files
export const jobFiles = pgTable("job_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type"),
  size: integer("size"),
  storagePath: varchar("storage_path").notNull(),
  isOriginal: boolean("is_original").default(true),
  virusScanStatus: varchar("virus_scan_status").default('pending'),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
}, (table) => [
  index("IDX_files_job").on(table.jobId),
]);

// Quotes
export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  wordCount: integer("word_count").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  turnaroundMultiplier: decimal("turnaround_multiplier", { precision: 4, scale: 2 }).default('1.00'),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).default('0.00'),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").default('ZAR'),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).default('1.000000'),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_quotes_job").on(table.jobId),
]);

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  quoteId: varchar("quote_id").notNull().references(() => quotes.id),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  orderNumber: varchar("order_number").unique(),
  status: varchar("status").default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_orders_job").on(table.jobId),
  index("IDX_orders_customer").on(table.customerId),
  index("IDX_orders_number").on(table.orderNumber),
]);

// Payments
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  gateway: varchar("gateway").notNull(),
  gatewayTransactionId: varchar("gateway_transaction_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").default('ZAR'),
  status: paymentStatusEnum("status").default('pending'),
  paidAt: timestamp("paid_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_payments_order").on(table.orderId),
  index("IDX_payments_status").on(table.status),
  index("IDX_payments_gateway_tx").on(table.gatewayTransactionId),
]);

// Invoices
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  invoiceNumber: varchar("invoice_number").unique().notNull(),
  customerName: varchar("customer_name"),
  customerEmail: varchar("customer_email"),
  customerAddress: text("customer_address"),
  vatNumber: varchar("vat_number"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).default('0.00'),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").default('ZAR'),
  issuedAt: timestamp("issued_at").defaultNow(),
  pdfPath: varchar("pdf_path"),
}, (table) => [
  index("IDX_invoices_order").on(table.orderId),
  index("IDX_invoices_number").on(table.invoiceNumber),
]);

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message"),
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_notifications_user").on(table.userId),
  index("IDX_notifications_read").on(table.isRead),
]);

// Disputes
export const disputes = pgTable("disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  raisedById: varchar("raised_by_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  status: varchar("status").default('open'),
  resolution: text("resolution"),
  resolvedById: varchar("resolved_by_id").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_disputes_job").on(table.jobId),
  index("IDX_disputes_status").on(table.status),
]);

// Pricing configuration
export const pricingConfig = pgTable("pricing_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceType: serviceTypeEnum("service_type").notNull(),
  pricePerWord: decimal("price_per_word", { precision: 6, scale: 4 }).notNull(),
  minPrice: decimal("min_price", { precision: 10, scale: 2 }).default('50.00'),
  turnaround24hMultiplier: decimal("turnaround_24h_multiplier", { precision: 4, scale: 2 }).default('2.00'),
  turnaround48hMultiplier: decimal("turnaround_48h_multiplier", { precision: 4, scale: 2 }).default('1.50'),
  turnaround72hMultiplier: decimal("turnaround_72h_multiplier", { precision: 4, scale: 2 }).default('1.25'),
  turnaround1weekMultiplier: decimal("turnaround_1week_multiplier", { precision: 4, scale: 2 }).default('1.00'),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default('15.00'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exchange rates
export const exchangeRates = pgTable("exchange_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromCurrency: currencyEnum("from_currency").notNull(),
  toCurrency: currencyEnum("to_currency").notNull(),
  rate: decimal("rate", { precision: 10, scale: 6 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  reviewerProfile: one(reviewerProfiles, {
    fields: [users.id],
    references: [reviewerProfiles.userId],
  }),
  customerJobs: many(jobs, { relationName: 'customerJobs' }),
  reviewerJobs: many(jobs, { relationName: 'reviewerJobs' }),
  orders: many(orders),
  notifications: many(notifications),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  customer: one(users, {
    fields: [jobs.customerId],
    references: [users.id],
    relationName: 'customerJobs',
  }),
  reviewer: one(users, {
    fields: [jobs.reviewerId],
    references: [users.id],
    relationName: 'reviewerJobs',
  }),
  files: many(jobFiles),
  quotes: many(quotes),
  orders: many(orders),
  disputes: many(disputes),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  job: one(jobs, {
    fields: [orders.jobId],
    references: [jobs.id],
  }),
  quote: one(quotes, {
    fields: [orders.quoteId],
    references: [quotes.id],
  }),
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
  }),
  payments: many(payments),
  invoices: many(invoices),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertJobFileSchema = createInsertSchema(jobFiles).omit({ id: true, uploadedAt: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, issuedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertDisputeSchema = createInsertSchema(disputes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReviewerProfileSchema = createInsertSchema(reviewerProfiles).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type JobFile = typeof jobFiles.$inferSelect;
export type InsertJobFile = z.infer<typeof insertJobFileSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type ReviewerProfile = typeof reviewerProfiles.$inferSelect;
export type InsertReviewerProfile = z.infer<typeof insertReviewerProfileSchema>;
export type PricingConfig = typeof pricingConfig.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;

// Service type definitions for frontend
export const SERVICE_TYPES = {
  proofreading: {
    name: 'Proofreading',
    description: 'Spelling, grammar, and punctuation corrections',
    features: ['Grammar & spelling fixes', 'Punctuation corrections', 'Typo elimination'],
  },
  editing: {
    name: 'Editing',
    description: 'Comprehensive content improvement and restructuring',
    features: ['All proofreading services', 'Sentence restructuring', 'Clarity improvements', 'Flow optimization'],
  },
  formatting: {
    name: 'Formatting',
    description: 'Document formatting and style consistency',
    features: ['Style guide compliance', 'Citation formatting', 'Layout optimization', 'Table of contents'],
  },
  consultation: {
    name: 'Book 1h Consultation',
    description: 'One-on-one expert consultation session',
    features: ['Personalized feedback', 'Strategy discussion', 'Document review walkthrough', 'Q&A session'],
  },
} as const;

export const TURNAROUND_OPTIONS = {
  '24h': { label: '24 Hours', description: 'Express delivery', multiplier: 2.0 },
  '48h': { label: '48 Hours', description: 'Fast turnaround', multiplier: 1.5 },
  '72h': { label: '72 Hours', description: 'Standard delivery', multiplier: 1.25 },
  '1week': { label: '1 Week', description: 'Economy option', multiplier: 1.0 },
} as const;

export const JOB_STATUS_LABELS = {
  draft: 'Draft',
  quoted: 'Quoted',
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  assigned: 'Assigned',
  in_review: 'In Review',
  revision_requested: 'Revision Requested',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
} as const;
