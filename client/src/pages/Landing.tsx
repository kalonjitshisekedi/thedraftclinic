import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ServiceCard } from "@/components/ServiceCard";
import { SERVICE_TYPES } from "@shared/schema";
import {
  Upload,
  FileCheck,
  CreditCard,
  Download,
  Shield,
  Lock,
  Award,
  Clock,
  Users,
  CheckCircle2,
  Star,
  ArrowRight,
} from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    title: "Upload Document",
    description: "Drop your document and select your preferred service and turnaround time.",
  },
  {
    icon: FileCheck,
    title: "Get Instant Quote",
    description: "Receive a transparent price based on word count, service type, and deadline.",
  },
  {
    icon: CreditCard,
    title: "Secure Payment",
    description: "Pay securely with your preferred method. VAT invoices provided for SA clients.",
  },
  {
    icon: Download,
    title: "Download Result",
    description: "Get your professionally reviewed document delivered to your inbox on time.",
  },
];

const TRUST_POINTS = [
  {
    icon: Shield,
    title: "POPIA Compliant",
    description: "Your documents are handled in accordance with South African privacy laws.",
  },
  {
    icon: Lock,
    title: "Secure & Encrypted",
    description: "End-to-end encryption protects your files throughout the review process.",
  },
  {
    icon: Award,
    title: "Expert Reviewers",
    description: "Our team consists of qualified editors with years of professional experience.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.1),transparent_50%)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Badge variant="secondary" className="mb-6" data-testid="badge-hero">
            Trusted by 2,500+ clients worldwide
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Professional Document
            <span className="text-primary block">Review Services</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Expert proofreading, editing, and formatting with fast turnaround times. 
            Upload your document and get an instant quote in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" asChild data-testid="button-hero-cta">
              <Link href="/quote">
                Get a Quote
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-hero-how-it-works">
              <a href="#how-it-works">How It Works</a>
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>500+ Documents Reviewed</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>24h Turnaround Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the service that best fits your needs. All services include multiple revision rounds.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.entries(SERVICE_TYPES) as [keyof typeof SERVICE_TYPES, typeof SERVICE_TYPES[keyof typeof SERVICE_TYPES]][]).map(
              ([key, service]) => (
                <ServiceCard
                  key={key}
                  type={key}
                  name={service.name}
                  description={service.description}
                  features={service.features}
                  priceRange={service.priceRange}
                />
              )
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get your document professionally reviewed in four simple steps.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, index) => (
              <div key={index} className="text-center" data-testid={`step-${index + 1}`}>
                <div className="relative inline-flex">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold font-serif">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why Choose Draft Clinic</h2>
              <div className="space-y-6">
                {TRUST_POINTS.map((point, index) => (
                  <div key={index} className="flex gap-4" data-testid={`trust-point-${index}`}>
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <point.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{point.title}</h3>
                      <p className="text-sm text-muted-foreground">{point.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <Card className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <p className="font-serif text-lg italic text-muted-foreground">
                      "Draft Clinic transformed my thesis into a polished masterpiece. 
                      The attention to detail and quick turnaround exceeded my expectations. 
                      Highly recommended for any academic work!"
                    </p>
                  </div>
                </div>
                <div className="ml-16">
                  <p className="font-medium">Dr. Amanda Nkosi</p>
                  <p className="text-sm text-muted-foreground">PhD Candidate, University of Cape Town</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Security & Compliance</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your documents are protected by industry-leading security measures.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">POPIA Compliant</h3>
                <p className="text-sm text-muted-foreground">
                  We adhere to the Protection of Personal Information Act for South African clients.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Secure Payments</h3>
                <p className="text-sm text-muted-foreground">
                  PCI-compliant payment processing with PayFast, Yoco, and international options.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Data Encryption</h3>
                <p className="text-sm text-muted-foreground">
                  All documents are encrypted at rest and in transit with AES-256 encryption.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Polish Your Document?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get a quote in under 60 seconds. No commitment required.
          </p>
          <Button size="lg" asChild data-testid="button-final-cta">
            <Link href="/quote">
              Get a Quote
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            No commitment required • Quote in 60 seconds • Secure upload
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
