"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  FileText, 
  Calculator, 
  Shield,
  Globe,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const steps: Step[] = [
  {
    id: "welcome",
    title: "Welcome to TaxDoc",
    description: "The world's most advanced AI-powered tax management app",
    icon: <Sparkles className="w-8 h-8" />,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Let's get you started with a quick tour of TaxDoc's powerful features.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold mb-2">Multi-Provider AI</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              GPT-4o, Claude 3.5, and Gemini working together
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-semibold mb-2">Zero-Knowledge Security</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your data is encrypted end-to-end
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "documents",
    title: "Document Management",
    description: "Upload and organize your tax documents with AI",
    icon: <FileText className="w-8 h-8" />,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          TaxDoc automatically categorizes and extracts information from your documents using advanced AI.
        </p>
        <ul className="space-y-2 mt-4">
          <li className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span>Drag and drop file upload</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span>Automatic OCR and text extraction</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span>Smart categorization</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span>Multi-year organization</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "calculator",
    title: "Tax Calculator",
    description: "Calculate your taxes with AI-powered insights",
    icon: <Calculator className="w-8 h-8" />,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Our advanced tax calculator helps you estimate refunds, identify deductions, and optimize your tax strategy.
        </p>
        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h4 className="font-semibold mb-2">Key Features</h4>
          <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
            <li>• Real-time refund estimation</li>
            <li>• Multi-year comparison</li>
            <li>• Deduction finder</li>
            <li>• Audit risk assessment</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "security",
    title: "Enterprise Security",
    description: "Your data is protected with military-grade encryption",
    icon: <Shield className="w-8 h-8" />,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          TaxDoc uses zero-knowledge architecture, meaning even we can't see your data.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-semibold mb-2">AES-256 Encryption</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Bank-level security
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-semibold mb-2">2FA Support</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Multi-factor authentication
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "global",
    title: "Global Support",
    description: "50+ countries, 20+ languages",
    icon: <Globe className="w-8 h-8" />,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          TaxDoc supports tax systems from over 50 countries and is available in 20+ languages.
        </p>
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {["US", "UK", "CA", "AU", "DE", "FR", "IT", "ES", "NL", "BE"].map((country) => (
              <span
                key={country}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-sm"
              >
                {country}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onSkip?.();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
              {currentStepData.icon}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {currentStepData.description}
            </p>
          </div>

          <div className="mt-8">{currentStepData.content}</div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentStep
                    ? "bg-blue-600 dark:bg-blue-500 w-8"
                    : completedSteps.has(index)
                    ? "bg-green-500"
                    : "bg-gray-300 dark:bg-gray-600"
                )}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            {!isFirstStep && (
              <Button variant="ghost" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            {onSkip && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
            )}
            <Button variant="primary" onClick={handleNext}>
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}



