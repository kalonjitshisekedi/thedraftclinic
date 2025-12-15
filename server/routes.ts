import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertJobSchema, insertQuoteSchema, TURNAROUND_OPTIONS } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  app.get("/api/auth/user", async (req: Request, res: Response) => {
    const sessionUser = (req.session as any)?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    let user = await storage.getUser(sessionUser.id);
    if (!user) {
      user = await storage.upsertUser({
        id: sessionUser.id,
        email: sessionUser.email,
        firstName: sessionUser.firstName,
        lastName: sessionUser.lastName,
        profileImageUrl: sessionUser.profileImageUrl,
      });
    }
    res.json(user);
  });

  app.get("/api/jobs", isAuthenticated, async (req: Request, res: Response) => {
    const user = (req.session as any).user;
    const dbUser = await storage.getUser(user.id);
    
    if (dbUser?.role === 'admin') {
      const jobs = await storage.getAllJobs();
      return res.json(jobs);
    } else if (dbUser?.role === 'reviewer') {
      const jobs = await storage.getJobsByReviewer(user.id);
      return res.json(jobs);
    } else {
      const jobs = await storage.getJobsByCustomer(user.id);
      return res.json(jobs);
    }
  });

  app.get("/api/jobs/:id", isAuthenticated, async (req: Request, res: Response) => {
    const job = await storage.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  });

  app.post("/api/jobs", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      const parsed = insertJobSchema.parse({
        ...req.body,
        customerId: user.id,
        status: 'draft',
      });
      const job = await storage.createJob(parsed);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });

  app.patch("/api/jobs/:id", isAuthenticated, async (req: Request, res: Response) => {
    const job = await storage.updateJob(req.params.id, req.body);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  });

  app.post("/api/jobs/:id/assign", isAuthenticated, async (req: Request, res: Response) => {
    const user = (req.session as any).user;
    const dbUser = await storage.getUser(user.id);
    
    if (dbUser?.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const { reviewerId } = req.body;
    const job = await storage.updateJob(req.params.id, {
      reviewerId,
      status: 'assigned',
    });
    
    if (job) {
      await storage.createNotification({
        userId: reviewerId,
        type: 'job_assigned',
        title: 'New Job Assigned',
        message: `You have been assigned a new ${job.serviceType} job.`,
      });
    }
    
    res.json(job);
  });

  app.get("/api/jobs/:id/files", isAuthenticated, async (req: Request, res: Response) => {
    const files = await storage.getJobFiles(req.params.id);
    res.json(files);
  });

  app.post("/api/jobs/:id/files", isAuthenticated, async (req: Request, res: Response) => {
    const file = await storage.createJobFile({
      ...req.body,
      jobId: req.params.id,
    });
    res.status(201).json(file);
  });

  app.get("/api/quotes/:jobId", isAuthenticated, async (req: Request, res: Response) => {
    const quote = await storage.getQuoteByJob(req.params.jobId);
    res.json(quote);
  });

  app.post("/api/quotes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parsed = insertQuoteSchema.parse(req.body);
      const quote = await storage.createQuote(parsed);
      
      await storage.updateJob(parsed.jobId, { status: 'quoted' });
      
      res.status(201).json(quote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      throw error;
    }
  });

  app.post("/api/quotes/calculate", async (req: Request, res: Response) => {
    const { serviceType, wordCount, turnaround, currency = 'ZAR' } = req.body;
    
    const basePrices: Record<string, number> = {
      proofreading: 0.08,
      editing: 0.15,
      formatting: 0.10,
    };
    
    const pricePerWord = basePrices[serviceType] || 0.10;
    const turnaroundOption = TURNAROUND_OPTIONS[turnaround as keyof typeof TURNAROUND_OPTIONS];
    const multiplier = turnaroundOption?.multiplier || 1.0;
    
    const basePrice = wordCount * pricePerWord;
    const subtotal = basePrice * multiplier;
    const minPrice = 50;
    const adjustedSubtotal = Math.max(subtotal, minPrice);
    const vatRate = 0.15;
    const vatAmount = adjustedSubtotal * vatRate;
    const total = adjustedSubtotal + vatAmount;
    
    let exchangeRate = 1;
    if (currency !== 'ZAR') {
      const rates: Record<string, number> = { USD: 0.055, EUR: 0.050, GBP: 0.043 };
      exchangeRate = rates[currency] || 1;
    }
    
    res.json({
      wordCount,
      basePrice: basePrice * exchangeRate,
      turnaroundMultiplier: multiplier,
      subtotal: adjustedSubtotal * exchangeRate,
      vatAmount: vatAmount * exchangeRate,
      total: total * exchangeRate,
      currency,
      exchangeRate,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  });

  app.post("/api/orders", isAuthenticated, async (req: Request, res: Response) => {
    const user = (req.session as any).user;
    const order = await storage.createOrder({
      ...req.body,
      customerId: user.id,
    });
    res.status(201).json(order);
  });

  app.get("/api/orders", isAuthenticated, async (req: Request, res: Response) => {
    const user = (req.session as any).user;
    const orders = await storage.getOrdersByCustomer(user.id);
    res.json(orders);
  });

  app.post("/api/payments/mock", isAuthenticated, async (req: Request, res: Response) => {
    const { orderId, amount, currency } = req.body;
    
    const payment = await storage.createPayment({
      orderId,
      gateway: 'mock',
      gatewayTransactionId: `MOCK-${Date.now()}`,
      amount: amount.toString(),
      currency,
      status: 'completed',
    });
    
    await storage.updatePayment(payment.id, { paidAt: new Date(), status: 'completed' });
    
    const order = await storage.getOrder(orderId);
    if (order) {
      await storage.updateOrder(orderId, { status: 'paid' });
      await storage.updateJob(order.jobId, { status: 'paid' });
      
      const quote = await storage.getQuote(order.quoteId);
      if (quote) {
        await storage.createInvoice({
          orderId,
          subtotal: quote.subtotal,
          vatAmount: quote.vatAmount || '0',
          total: quote.total,
          currency: quote.currency || 'ZAR',
        });
      }
    }
    
    res.json({ success: true, payment });
  });

  app.get("/api/invoices/:orderId", isAuthenticated, async (req: Request, res: Response) => {
    const invoice = await storage.getInvoiceByOrder(req.params.orderId);
    res.json(invoice);
  });

  app.get("/api/notifications", isAuthenticated, async (req: Request, res: Response) => {
    const user = (req.session as any).user;
    const notifications = await storage.getNotifications(user.id);
    res.json(notifications);
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    await storage.markNotificationRead(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/stats", isAuthenticated, async (req: Request, res: Response) => {
    const user = (req.session as any).user;
    const dbUser = await storage.getUser(user.id);
    
    if (dbUser?.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const stats = await storage.getJobStats();
    res.json(stats);
  });

  app.get("/api/admin/unassigned-jobs", isAuthenticated, async (req: Request, res: Response) => {
    const user = (req.session as any).user;
    const dbUser = await storage.getUser(user.id);
    
    if (dbUser?.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const jobs = await storage.getUnassignedJobs();
    res.json(jobs);
  });

  app.get("/api/admin/reviewers", isAuthenticated, async (req: Request, res: Response) => {
    const user = (req.session as any).user;
    const dbUser = await storage.getUser(user.id);
    
    if (dbUser?.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const reviewers = await storage.getAllReviewers();
    const workload = await storage.getReviewerWorkload();
    
    res.json(reviewers.map(r => ({
      ...r,
      activeJobs: workload.find(w => w.reviewerId === r.userId)?.activeJobs || 0,
    })));
  });

  app.get("/api/pricing", async (_req: Request, res: Response) => {
    const configs = await storage.getAllPricingConfigs();
    res.json(configs);
  });

  return httpServer;
}
