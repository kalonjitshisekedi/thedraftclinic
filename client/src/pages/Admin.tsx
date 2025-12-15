import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard,
  FileText,
  Users,
  UserCheck,
  CreditCard,
  AlertTriangle,
  Settings,
  BarChart3,
  Clock,
  CheckCircle2,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import type { Job, User } from "@shared/schema";

const ADMIN_NAV = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "All Jobs", href: "/admin/jobs", icon: FileText },
  { title: "Assign Jobs", href: "/admin/assign", icon: UserCheck },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Reviewers", href: "/admin/reviewers", icon: UserCheck },
  { title: "Payments", href: "/admin/payments", icon: CreditCard },
  { title: "Disputes", href: "/admin/disputes", icon: AlertTriangle },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

function AdminSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <span className="font-bold">Draft Clinic</span>
        </Link>
        <Badge variant="secondary" className="mt-2">Admin</Badge>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ADMIN_NAV.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href} data-testid={`admin-nav-${item.title.toLowerCase().replace(" ", "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function AdminStatCard({
  title,
  value,
  icon: Icon,
  change,
  changeType,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}) {
  return (
    <Card data-testid={`admin-stat-${title.toLowerCase().replace(" ", "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs ${
            changeType === "positive" ? "text-green-600" :
            changeType === "negative" ? "text-red-600" :
            "text-muted-foreground"
          }`}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/auth/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: unassignedJobs } = useQuery<Job[]>({
    queryKey: ["/api/admin/unassigned-jobs"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: reviewers } = useQuery<any[]>({
    queryKey: ["/api/admin/reviewers"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between gap-4 p-4 border-b border-border">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-admin-sidebar-toggle" />
              <h1 className="font-semibold">Admin Dashboard</h1>
            </div>
            <ThemeToggle />
          </header>
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminStatCard
                  title="Total Revenue"
                  value="R45,231"
                  icon={DollarSign}
                  change="+12% from last month"
                  changeType="positive"
                />
                <AdminStatCard
                  title="Active Jobs"
                  value={jobs?.filter((j) => !["completed", "cancelled"].includes(j.status)).length || 0}
                  icon={Clock}
                />
                <AdminStatCard
                  title="Completed Today"
                  value={jobs?.filter((j) => {
                    if (!j.completedAt) return false;
                    const today = new Date().toDateString();
                    return new Date(j.completedAt).toDateString() === today;
                  }).length || 0}
                  icon={CheckCircle2}
                />
                <AdminStatCard
                  title="Avg. Turnaround"
                  value="28h"
                  icon={TrendingUp}
                  change="-4h from last week"
                  changeType="positive"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Unassigned Jobs</CardTitle>
                    <CardDescription>Jobs waiting for reviewer assignment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {jobsLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : unassignedJobs && unassignedJobs.length > 0 ? (
                      <div className="space-y-3">
                        {(unassignedJobs || []).slice(0, 5).map((job) => (
                          <div
                            key={job.id}
                            className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-md"
                            data-testid={`unassigned-job-${job.id}`}
                          >
                            <div>
                              <p className="font-medium text-sm">
                                {job.title || `Job #${job.id.slice(0, 8)}`}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {job.serviceType} • {job.wordCount?.toLocaleString()} words
                              </p>
                            </div>
                            <Select>
                              <SelectTrigger className="w-[140px]" data-testid={`select-reviewer-${job.id}`}>
                                <SelectValue placeholder="Assign to..." />
                              </SelectTrigger>
                              <SelectContent>
                                {(reviewers || []).map((reviewer) => (
                                  <SelectItem key={reviewer.id} value={reviewer.id}>
                                    {reviewer.firstName} {reviewer.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No unassigned jobs
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Reviewer Workload</CardTitle>
                    <CardDescription>Current assignments per reviewer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reviewers && reviewers.length > 0 ? (
                        (reviewers || []).map((reviewer) => {
                          const assignedCount = jobs?.filter((j) => j.reviewerId === reviewer.id && j.status === "in_review").length || 0;
                          return (
                            <div
                              key={reviewer.id}
                              className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-md"
                              data-testid={`reviewer-workload-${reviewer.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-medium">
                                    {reviewer.firstName?.[0]}{reviewer.lastName?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">
                                    {reviewer.firstName} {reviewer.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{reviewer.email}</p>
                                </div>
                              </div>
                              <Badge variant={assignedCount > 3 ? "destructive" : "secondary"}>
                                {assignedCount} jobs
                              </Badge>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No reviewers found
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>Recent Jobs</CardTitle>
                    <CardDescription>All jobs across the platform</CardDescription>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/admin/jobs" data-testid="link-admin-all-jobs">View All</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {jobsLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : jobs && jobs.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Reviewer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobs.slice(0, 10).map((job) => (
                          <TableRow key={job.id} data-testid={`admin-row-job-${job.id}`}>
                            <TableCell className="font-mono text-xs">
                              {job.id.slice(0, 8)}
                            </TableCell>
                            <TableCell>{job.customerId.slice(0, 8)}</TableCell>
                            <TableCell className="capitalize">{job.serviceType}</TableCell>
                            <TableCell>
                              {job.reviewerId ? job.reviewerId.slice(0, 8) : "-"}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={job.status} />
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No jobs found</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
