import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ServiceCard } from "@/components/ServiceCard";
import { TurnaroundSelector } from "@/components/TurnaroundSelector";
import { FileUpload } from "@/components/FileUpload";
import { QuoteSummary } from "@/components/QuoteSummary";
import { StepIndicator } from "@/components/StepIndicator";
import { CurrencySelector } from "@/components/CurrencySelector";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SERVICE_TYPES, TURNAROUND_OPTIONS } from "@shared/schema";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

type ServiceType = keyof typeof SERVICE_TYPES;
type TurnaroundType = keyof typeof TURNAROUND_OPTIONS;
type Currency = "ZAR" | "USD" | "EUR" | "GBP";

const STEPS = [
  { id: "service", label: "Select Service" },
  { id: "upload", label: "Upload Document" },
  { id: "quote", label: "Review Quote" },
  { id: "payment", label: "Payment" },
];

export default function Quote() {
  const searchString = useSearch();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [serviceType, setServiceType] = useState<ServiceType>("proofreading");
  const [turnaround, setTurnaround] = useState<TurnaroundType>("72h");
  const [files, setFiles] = useState<File[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [instructions, setInstructions] = useState("");
  const [currency, setCurrency] = useState<Currency>("ZAR");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const service = params.get("service") as ServiceType;
    if (service && SERVICE_TYPES[service]) {
      setServiceType(service);
    }
  }, [searchString]);

  const createJobMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/jobs", {
        serviceType,
        turnaround,
        wordCount,
        instructions: instructions || undefined,
      });
      return response.json();
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const calcResponse = await apiRequest("POST", "/api/quotes/calculate", {
        serviceType,
        wordCount,
        turnaround,
        currency,
      });
      const calcData = await calcResponse.json();

      const quoteResponse = await apiRequest("POST", "/api/quotes", {
        jobId,
        wordCount,
        basePrice: calcData.basePrice.toString(),
        turnaroundMultiplier: calcData.turnaroundMultiplier.toString(),
        subtotal: calcData.subtotal.toString(),
        vatAmount: calcData.vatAmount.toString(),
        total: calcData.total.toString(),
        currency,
        validUntil: calcData.validUntil,
      });
      return quoteResponse.json();
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async ({ jobId, quoteId }: { jobId: string; quoteId: string }) => {
      const response = await apiRequest("POST", "/api/orders", {
        jobId,
        quoteId,
      });
      return response.json();
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async ({ orderId, amount }: { orderId: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/payments/mock", {
        orderId,
        amount,
        currency,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setPaymentComplete(true);
      toast({
        title: "Payment Successful",
        description: "Your order has been placed. Our team will start working on your document shortly.",
      });
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!serviceType && !!turnaround;
      case 1:
        return files.length > 0 && wordCount > 0;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      window.location.href = "/api/auth/login";
      return;
    }
    setIsSubmitting(true);
    setCurrentStep(3);
    setIsSubmitting(false);
  };

  const handlePaymentMethodSelect = async (method: string) => {
    if (!isAuthenticated) {
      window.location.href = "/api/auth/login";
      return;
    }

    setSelectedPaymentMethod(method);
    setIsSubmitting(true);

    try {
      const job = await createJobMutation.mutateAsync();
      
      const quote = await createQuoteMutation.mutateAsync(job.id);
      
      const order = await createOrderMutation.mutateAsync({
        jobId: job.id,
        quoteId: quote.id,
      });
      
      await processPaymentMutation.mutateAsync({
        orderId: order.id,
        amount: parseFloat(quote.total),
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setSelectedPaymentMethod(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="max-w-lg mx-auto px-4 text-center">
            <div className="p-6 bg-green-500/10 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Successful</h1>
            <p className="text-muted-foreground mb-6">
              Your order has been placed successfully. Redirecting to your dashboard...
            </p>
            <Button onClick={() => navigate("/dashboard")} data-testid="button-go-dashboard">
              Go to Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <StepIndicator steps={STEPS} currentStep={currentStep} />

          {currentStep === 0 && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold mb-2">Select Your Service</h1>
                <p className="text-muted-foreground">
                  Choose the type of review and your preferred turnaround time.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {(Object.entries(SERVICE_TYPES) as [ServiceType, typeof SERVICE_TYPES[ServiceType]][]).map(
                  ([key, service]) => (
                    <ServiceCard
                      key={key}
                      type={key}
                      name={service.name}
                      description={service.description}
                      features={service.features}
                      priceRange={service.priceRange}
                      isSelected={serviceType === key}
                      onSelect={() => setServiceType(key)}
                    />
                  )
                )}
              </div>

              <TurnaroundSelector value={turnaround} onChange={setTurnaround} />
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold mb-2">Upload Your Document</h1>
                <p className="text-muted-foreground">
                  Upload your document for analysis. We'll calculate the word count automatically.
                </p>
              </div>

              <FileUpload
                onFilesChange={setFiles}
                onWordCountCalculated={setWordCount}
              />

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Special Instructions (Optional)
                </label>
                <Textarea
                  placeholder="Any specific requirements or focus areas for the review..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                  data-testid="textarea-instructions"
                />
              </div>

              {wordCount > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Detected Word Count</span>
                      <span className="text-2xl font-bold text-primary" data-testid="text-detected-word-count">
                        {wordCount.toLocaleString()} words
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold mb-2">Review Your Quote</h1>
                <p className="text-muted-foreground">
                  Review the details below and proceed to payment.
                </p>
              </div>

              <div className="flex items-center justify-end">
                <CurrencySelector value={currency} onChange={setCurrency} />
              </div>

              <QuoteSummary
                serviceType={serviceType}
                turnaround={turnaround}
                wordCount={wordCount}
                currency={currency}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Document</span>
                      <p className="font-medium">{files[0]?.name || "No file"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Service</span>
                      <p className="font-medium">{SERVICE_TYPES[serviceType].name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Turnaround</span>
                      <p className="font-medium">{TURNAROUND_OPTIONS[turnaround].label}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Word Count</span>
                      <p className="font-medium">{wordCount.toLocaleString()}</p>
                    </div>
                  </div>
                  {instructions && (
                    <div>
                      <span className="text-sm text-muted-foreground">Instructions</span>
                      <p className="text-sm mt-1">{instructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {!isAuthenticated && !authLoading && (
                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="p-4">
                    <p className="text-sm text-center">
                      You'll need to sign in to complete your order.
                    </p>
                  </CardContent>
                </Card>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Quote valid for 24 hours. Prices include all applicable fees.
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold mb-2">Complete Payment</h1>
                <p className="text-muted-foreground">
                  Choose your preferred payment method to complete your order.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Select Payment Method</h3>
                  {["PayFast", "Yoco", "Ozow", "Stripe", "PayPal"].map((method) => (
                    <Button
                      key={method}
                      variant="outline"
                      className="w-full justify-start h-14"
                      disabled={isSubmitting}
                      onClick={() => handlePaymentMethodSelect(method)}
                      data-testid={`button-pay-${method.toLowerCase()}`}
                    >
                      {isSubmitting && selectedPaymentMethod === method ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {method}
                          {method === "PayFast" && (
                            <span className="ml-auto text-xs text-muted-foreground">Popular in SA</span>
                          )}
                        </>
                      )}
                    </Button>
                  ))}
                </div>

                <QuoteSummary
                  serviceType={serviceType}
                  turnaround={turnaround}
                  wordCount={wordCount}
                  currency={currency}
                />
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>Secure payment processing. Your payment details are encrypted.</p>
                <p className="mt-1">VAT invoice will be issued for South African transactions.</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < 2 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                data-testid="button-next"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : currentStep === 2 ? (
              <Button
                onClick={handleProceedToPayment}
                disabled={isSubmitting}
                data-testid="button-proceed-payment"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Proceed to Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
