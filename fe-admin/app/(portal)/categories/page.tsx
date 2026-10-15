"use client";

import { useTaxCategories } from "@/features/categories/hooks";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/shared/States";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, titleCase } from "@/lib/format";

export default function CategoriesPage() {
  const { data, isLoading, isError, refetch } = useTaxCategories();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Categories"
        description="Tax types and their defined rates."
      />

      {isLoading ? (
        <LoadingState label="Loading categories..." />
      ) : isError ? (
        <ErrorState
          message="Unable to load categories."
          onRetry={() => refetch()}
        />
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState title="No tax categories" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Rate Type</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Minimum</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.code}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {titleCase(category.rateType)}
                    </TableCell>
                    <TableCell className="text-right">
                      {category.rateType === "percentage"
                        ? `${category.rate}%`
                        : formatCurrency(category.rate)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(category.minAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge
                        status={category.isActive ? "active" : "inactive"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
