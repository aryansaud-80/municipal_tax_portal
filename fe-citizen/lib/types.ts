export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  status: string;
}

export interface Property {
  id: string;
  propertyNumber: string;
  userId: string;
  ownerName: string;
  address: string;
  ward: number;
  tole?: string;
  areaSqMeters: number;
  propertyType: string;
  status: string;
  landOwnershipNumber?: string;
  floorCount?: number;
  buildingAgeYears?: number;
  createdAt: string;
}

export interface TaxCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  rateType: "percentage" | "fixed";
  rate: number;
  minAmount: number;
  isActive: boolean;
}

export interface TaxAssessment {
  id: string;
  assessmentNumber: string;
  userId: string;
  propertyId: string;
  taxCategoryId: string;
  fiscalYear: string;
  assessedValue: number;
  taxAmount: number;
  discount: number;
  penalty: number;
  totalDue: number;
  amountPaid: number;
  status: "pending" | "partial_paid" | "paid" | "overdue";
  dueDate: string;
  notes?: string;
  taxCategory?: TaxCategory;
  property?: Property;
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  userId: string;
  taxAssessmentId: string;
  amount: number;
  method: string;
  gatewayTransactionId?: string | null;
  status: string;
  paidAt?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  failureReason?: string | null;
  taxAssessment?: TaxAssessment;
  createdAt: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  paymentId: string;
  userId: string;
  taxAssessmentId: string;
  amount: number;
  payment?: Payment;
  taxAssessment?: TaxAssessment;
  createdAt: string;
}

export interface CitizenDashboard {
  propertyCount: number;
  totalOutstanding: number;
  totalPaid: number;
  pendingAssessments: number;
  recentPayments: Payment[];
  recentAssessments: TaxAssessment[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  assessmentId?: string | null;
  userId: string;
  propertyId?: string | null;
  taxCategoryId: string;
  ruleId?: string | null;
  fiscalYear: string;
  billingPeriod: string;
  periodLabel: string;
  issueDate: string;
  dueDate: string;
  principal: number;
  discount: number;
  penalty: number;
  totalPayable: number;
  amountPaid: number;
  status: "issued" | "partially_paid" | "paid" | "overdue" | "cancelled" | "void";
  calculationBreakdown?: {
    baseAmount: number;
    rateApplied: number;
    rateType: string;
    slabDetails?: Array<{ label: string; amount: number }>;
    adjustments?: Array<{ label: string; amount: number; reason?: string }>;
    discount: number;
    penalty: number;
    totalPayable: number;
    ruleName?: string;
    inputs?: Record<string, unknown>;
  };
  version: number;
  taxCategory?: TaxCategory;
  property?: Property;
  createdAt: string;
}

export interface PropertyApplication {
  id: string;
  applicationNumber: string;
  applicantUserId: string;
  ownerName: string;
  address: string;
  ward: number;
  tole?: string;
  areaSqMeters: number;
  propertyType: string;
  landOwnershipNumber?: string;
  floorCount: number;
  buildingAgeYears?: number;
  status: "pending" | "correction_requested" | "approved" | "rejected";
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  propertyId?: string | null;
  resubmissionCount: number;
  createdAt: string;
}

export interface Fine {
  id: string;
  fineNumber: string;
  billId: string;
  baseAmount: number;
  penaltyBase: string;
  percent: number;
  amount: number;
  assessedDate: string;
  periodLabel: string;
  waived: boolean;
  waiverReason?: string | null;
}
