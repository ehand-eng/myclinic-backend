import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { ComprehensiveReportResponse } from '@/api/services/ReportService';

interface Props {
  bookings: ComprehensiveReportResponse['bookings'];
}

type SortKey = 'bookingDate' | 'patientName' | 'doctorName' | 'status' | 'totalFee';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 15;

const statusVariant: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  scheduled: 'bg-indigo-100 text-indigo-800',
  checked_in: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-orange-100 text-orange-800',
};

const statusLabel: Record<string, string> = {
  completed: 'Completed',
  scheduled: 'Scheduled',
  checked_in: 'Checked In',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

const ReportBookingsTable: React.FC<Props> = ({ bookings }) => {
  const [sortKey, setSortKey] = useState<SortKey>('bookingDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const sorted = useMemo(() => {
    const arr = [...bookings];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'bookingDate': cmp = new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime(); break;
        case 'patientName': cmp = (a.patientName || '').localeCompare(b.patientName || ''); break;
        case 'doctorName': cmp = (a.doctorName || '').localeCompare(b.doctorName || ''); break;
        case 'status': cmp = (a.status || '').localeCompare(b.status || ''); break;
        case 'totalFee': cmp = (a.fees?.totalFee || 0) - (b.fees?.totalFee || 0); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [bookings, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
      </div>
    </TableHead>
  );

  if (!bookings.length) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-8 text-center text-muted-foreground">
          No bookings found for the selected period and filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Booking Details ({bookings.length} records)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <SortHeader label="Date" field="bookingDate" />
                <TableHead>Time</TableHead>
                <TableHead>Ref</TableHead>
                <SortHeader label="Patient" field="patientName" />
                <TableHead>Phone</TableHead>
                <SortHeader label="Doctor" field="doctorName" />
                <TableHead>Dispensary</TableHead>
                <SortHeader label="Status" field="status" />
                <SortHeader label="Total Fee" field="totalFee" />
                <TableHead>Doctor Fee</TableHead>
                <TableHead>Disp Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((b, i) => (
                <TableRow key={b.id}>
                  <TableCell className="text-muted-foreground">{page * PAGE_SIZE + i + 1}</TableCell>
                  <TableCell className="whitespace-nowrap">{format(new Date(b.bookingDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{b.timeSlot}</TableCell>
                  <TableCell className="font-mono text-xs">{b.bookingReference?.slice(-8)}</TableCell>
                  <TableCell>{b.patientName}</TableCell>
                  <TableCell>{b.patientPhone}</TableCell>
                  <TableCell>{b.doctorName}</TableCell>
                  <TableCell>{b.dispensaryName}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusVariant[b.status] || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabel[b.status] || b.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{b.fees?.totalFee?.toFixed(2) || '-'}</TableCell>
                  <TableCell className="text-right">{b.fees?.doctorFee?.toFixed(2) || '-'}</TableCell>
                  <TableCell className="text-right">{b.fees?.dispensaryFee?.toFixed(2) || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportBookingsTable;
