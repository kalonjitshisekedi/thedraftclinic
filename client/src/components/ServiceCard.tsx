import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, FileText, Edit3, Layout } from "lucide-react";

const serviceIcons = {
  proofreading: FileText,
  editing: Edit3,
  formatting: Layout,
};

interface ServiceCardProps {
  type: "proofreading" | "editing" | "formatting";
  name: string;
  description: string;
  features: string[];
  priceRange: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function ServiceCard({
  type,
  name,
  description,
  features,
  priceRange,
  isSelected,
  onSelect,
}: ServiceCardProps) {
  const Icon = serviceIcons[type];

  return (
    <Card
      className={`relative overflow-visible transition-all duration-200 hover-elevate cursor-pointer ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
      data-testid={`card-service-${type}`}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-4 w-4" />
        </div>
      )}
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">{name}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-4 pt-4 border-t border-border">
        <span className="text-sm font-medium text-muted-foreground">{priceRange}</span>
        {onSelect ? (
          <Button
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            data-testid={`button-select-${type}`}
          >
            {isSelected ? "Selected" : "Select"}
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/quote?service=${type}`} data-testid={`link-select-${type}`}>
              Select Service
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
