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
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt?: string;
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
  user?: User;
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
  user?: User;
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
  user?: User;
  taxAssessment?: TaxAssessment & { taxCategory?: TaxCategory };
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

export interface AdminDashboard {
  totalTaxpayers: number;
  totalProperties: number;
  totalAssessments: number;
  pendingAssessments: number;
  paidAssessments: number;
  pendingPayments: number;
  verifiedPayments: number;
  totalRevenue: number;
  outstandingTax: number;
  recentPayments: Payment[];
  taxCategoryStats: {
    categoryId: string;
    categoryName: string;
    categoryCode: string;
    totalAssessed: number;
    totalCollected: number;
  }[];
  pendingApplications?: number;
  approvedApplications?: number;
  rejectedApplications?: number;
  billsIssued?: number;
  billsOutstanding?: number;
  billsOverdue?: number;
  finesRecorded?: number;
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
  status: string;
  calculationBreakdown?: Record<string, unknown>;
  version: number;
  cancelledReason?: string | null;
  taxCategory?: TaxCategory;
  property?: Property;
  user?: User;
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
  status: "pending" | "correction_requested" | "approved" | "rejected";
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  propertyId?: string | null;
  resubmissionCount: number;
  applicant?: { id: string; firstName: string; lastName: string; email: string };
  createdAt: string;
}

export interface TaxRule {
  id: string;
  taxCategoryId: string;
  name: string;
  fiscalYear: string;
  billingPeriod: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  rateType: string;
  rate: number;
  minAmount: number;
  fixedAmount?: number | null;
  penaltyPercent: number;
  penaltyBase: string;
  graceDays: number;
  dueDate?: string | null;
  calculationConfig?: Record<string, unknown>;
  requiredDocuments?: string[];
  isActive: boolean;
  taxCategory?: TaxCategory;
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
  bill?: Bill;
}

export interface AuditEvent {
  id: string;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  actor?: { id: string; firstName: string; lastName: string; email: string } | null;
  createdAt: string;
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  position?: string;
  wardAssignments: number[];
  canVerifyPayments: boolean;
  canAssess: boolean;
  canApproveProperty: boolean;
  user?: User;
}
