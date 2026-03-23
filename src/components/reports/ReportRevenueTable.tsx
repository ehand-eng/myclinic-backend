import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ComprehensiveReportResponse } from '@/api/services/ReportService';

interface Props {
  topDoctors: ComprehensiveReportResponse['topDoctors'];
  revenue: ComprehensiveReportResponse['revenue'];
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ReportRevenueTable: React.FC<Props> = ({ topDoctors, revenue }) => {
  if (!topDoctors.length) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Revenue by Doctor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead className="text-center">Bookings</TableHead>
                <TableHead className="text-right">Total Fee</TableHead>
                <TableHead className="text-right">Doctor Fee</TableHead>
                <TableHead className="text-right">Dispensary Fee</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">CP Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topDoctors.map(d => (
                <TableRow key={d.doctorId}>
                  <TableCell className="font-medium">{d.doctorName}</TableCell>
                  <TableCell className="text-center">{d.bookingCount}</TableCell>
                  <TableCell className="text-right">{fmt(d.totalFee)}</TableCell>
                  <TableCell className="text-right">{fmt(d.doctorFee)}</TableCell>
                  <TableCell className="text-right">{fmt(d.dispensaryFee)}</TableCell>
                  <TableCell className="text-right">{fmt(d.bookingCommission)}</TableCell>
                  <TableCell className="text-right">{fmt(d.channelPartnerFee)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="text-center font-bold">{topDoctors.reduce((s, d) => s + d.bookingCount, 0)}</TableCell>
                <TableCell className="text-right font-bold">{fmt(revenue.totalFee)}</TableCell>
                <TableCell className="text-right font-bold">{fmt(revenue.doctorFee)}</TableCell>
                <TableCell className="text-right font-bold">{fmt(revenue.dispensaryFee)}</TableCell>
                <TableCell className="text-right font-bold">{fmt(revenue.bookingCommission)}</TableCell>
                <TableCell className="text-right font-bold">{fmt(revenue.channelPartnerFee)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportRevenueTable;
