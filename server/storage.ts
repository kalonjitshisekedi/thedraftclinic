import { eq, desc, and, isNull, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users, jobs, jobFiles, quotes, orders, payments, invoices,
  notifications, disputes, reviewerProfiles, pricingConfig, exchangeRates,
  type User, type UpsertUser, type Job, type InsertJob, type JobFile, type InsertJobFile,
  type Quote, type InsertQuote, type Order, type InsertOrder, type Payment, type InsertPayment,
  type Invoice, type InsertInvoice, type Notification, type InsertNotification,
  type Dispute, type InsertDispute, type ReviewerProfile, type InsertReviewerProfile,
  type PricingConfig, type ExchangeRate
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: 'customer' | 'reviewer' | 'admin'): Promise<User | undefined>;
  
  getJob(id: string): Promise<Job | undefined>;
  getJobsByCustomer(customerId: string): Promise<Job[]>;
  getJobsByReviewer(reviewerId: string): Promise<Job[]>;
  getUnassignedJobs(): Promise<Job[]>;
  getAllJobs(): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined>;
  
  getJobFiles(jobId: string): Promise<JobFile[]>;
  createJobFile(file: InsertJobFile): Promise<JobFile>;
  
  getQuote(id: string): Promise<Quote | undefined>;
  getQuoteByJob(jobId: string): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByJob(jobId: string): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined>;
  
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentByOrder(orderId: string): Promise<Payment | undefined>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;
  
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoiceByOrder(orderId: string): Promise<Invoice | undefined>;
  
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  
  getReviewerProfile(userId: string): Promise<ReviewerProfile | undefined>;
  getAllReviewers(): Promise<(ReviewerProfile & { user: User })[]>;
  createReviewerProfile(profile: InsertReviewerProfile): Promise<ReviewerProfile>;
  updateReviewerProfile(id: string, updates: Partial<ReviewerProfile>): Promise<ReviewerProfile | undefined>;
  
  getPricingConfig(serviceType: string): Promise<PricingConfig | undefined>;
  getAllPricingConfigs(): Promise<PricingConfig[]>;
  
  getExchangeRate(from: string, to: string): Promise<ExchangeRate | undefined>;
  
  getJobStats(): Promise<{ total: number; pending: number; inReview: number; completed: number }>;
  getReviewerWorkload(): Promise<{ reviewerId: string; activeJobs: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: 'customer' | 'reviewer' | 'admin'): Promise<User | undefined> {
    const [user] = await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getJobsByCustomer(customerId: string): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.customerId, customerId)).orderBy(desc(jobs.createdAt));
  }

  async getJobsByReviewer(reviewerId: string): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.reviewerId, reviewerId)).orderBy(desc(jobs.createdAt));
  }

  async getUnassignedJobs(): Promise<Job[]> {
    return db.select().from(jobs).where(and(eq(jobs.status, 'paid'), isNull(jobs.reviewerId))).orderBy(desc(jobs.createdAt));
  }

  async getAllJobs(): Promise<Job[]> {
    return db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [created] = await db.insert(jobs).values(job).returning();
    return created;
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const [updated] = await db.update(jobs).set({ ...updates, updatedAt: new Date() }).where(eq(jobs.id, id)).returning();
    return updated;
  }

  async getJobFiles(jobId: string): Promise<JobFile[]> {
    return db.select().from(jobFiles).where(eq(jobFiles.jobId, jobId));
  }

  async createJobFile(file: InsertJobFile): Promise<JobFile> {
    const [created] = await db.insert(jobFiles).values(file).returning();
    return created;
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote;
  }

  async getQuoteByJob(jobId: string): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.jobId, jobId)).orderBy(desc(quotes.createdAt));
    return quote;
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [created] = await db.insert(quotes).values(quote).returning();
    return created;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderByJob(jobId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.jobId, jobId));
    return order;
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const orderNumber = `DC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const [created] = await db.insert(orders).values({ ...order, orderNumber }).returning();
    return created;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ ...updates, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async getPaymentByOrder(orderId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId));
    return payment;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [updated] = await db.update(payments).set({ ...updates, updatedAt: new Date() }).where(eq(payments.id, id)).returning();
    return updated;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const [created] = await db.insert(invoices).values({ ...invoice, invoiceNumber }).returning();
    return created;
  }

  async getInvoiceByOrder(orderId: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.orderId, orderId));
    return invoice;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async getReviewerProfile(userId: string): Promise<ReviewerProfile | undefined> {
    const [profile] = await db.select().from(reviewerProfiles).where(eq(reviewerProfiles.userId, userId));
    return profile;
  }

  async getAllReviewers(): Promise<(ReviewerProfile & { user: User })[]> {
    const result = await db
      .select()
      .from(reviewerProfiles)
      .innerJoin(users, eq(reviewerProfiles.userId, users.id));
    return result.map(r => ({ ...r.reviewer_profiles, user: r.users }));
  }

  async createReviewerProfile(profile: InsertReviewerProfile): Promise<ReviewerProfile> {
    const [created] = await db.insert(reviewerProfiles).values(profile).returning();
    return created;
  }

  async updateReviewerProfile(id: string, updates: Partial<ReviewerProfile>): Promise<ReviewerProfile | undefined> {
    const [updated] = await db.update(reviewerProfiles).set({ ...updates, updatedAt: new Date() }).where(eq(reviewerProfiles.id, id)).returning();
    return updated;
  }

  async getPricingConfig(serviceType: string): Promise<PricingConfig | undefined> {
    const [config] = await db.select().from(pricingConfig).where(and(eq(pricingConfig.serviceType, serviceType as any), eq(pricingConfig.isActive, true)));
    return config;
  }

  async getAllPricingConfigs(): Promise<PricingConfig[]> {
    return db.select().from(pricingConfig).where(eq(pricingConfig.isActive, true));
  }

  async getExchangeRate(from: string, to: string): Promise<ExchangeRate | undefined> {
    const [rate] = await db.select().from(exchangeRates).where(and(eq(exchangeRates.fromCurrency, from as any), eq(exchangeRates.toCurrency, to as any)));
    return rate;
  }

  async getJobStats(): Promise<{ total: number; pending: number; inReview: number; completed: number }> {
    const allJobs = await db.select().from(jobs);
    return {
      total: allJobs.length,
      pending: allJobs.filter(j => ['draft', 'quoted', 'pending_payment', 'paid', 'assigned'].includes(j.status)).length,
      inReview: allJobs.filter(j => j.status === 'in_review').length,
      completed: allJobs.filter(j => j.status === 'completed').length,
    };
  }

  async getReviewerWorkload(): Promise<{ reviewerId: string; activeJobs: number }[]> {
    const activeJobs = await db.select().from(jobs).where(and(eq(jobs.status, 'in_review')));
    const workload: Record<string, number> = {};
    activeJobs.forEach(job => {
      if (job.reviewerId) {
        workload[job.reviewerId] = (workload[job.reviewerId] || 0) + 1;
      }
    });
    return Object.entries(workload).map(([reviewerId, activeJobs]) => ({ reviewerId, activeJobs }));
  }
}

export const storage = new DatabaseStorage();
