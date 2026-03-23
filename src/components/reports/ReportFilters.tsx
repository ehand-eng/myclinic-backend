import React, { useEffect, useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DispensaryService } from '@/api/services/DispensaryService';
import { DoctorService } from '@/api/services/DoctorService';

export type Period = 'daily' | 'weekly' | 'monthly';

export interface FilterState {
  period: Period;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  dispensaryId: string;
  doctorId: string;
  status: string;
}

interface ReportFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

/** Compute default start/end for a given period around today */
export const getDefaultDates = (period: Period): { startDate: string; endDate: string } => {
  const today = new Date();
  if (period === 'weekly') {
    const ws = startOfWeek(today, { weekStartsOn: 1 });
    const we = endOfWeek(today, { weekStartsOn: 1 });
    return { startDate: format(ws, 'yyyy-MM-dd'), endDate: format(we, 'yyyy-MM-dd') };
  }
  if (period === 'monthly') {
    return { startDate: format(startOfMonth(today), 'yyyy-MM-dd'), endDate: format(endOfMonth(today), 'yyyy-MM-dd') };
  }
  const d = format(today, 'yyyy-MM-dd');
  return { startDate: d, endDate: d };
};

const ReportFilters: React.FC<ReportFiltersProps> = ({ filters, onFilterChange }) => {
  const [dispensaries, setDispensaries] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('current_user') || sessionStorage.getItem('current_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user?.dispensaryIds?.length) {
      DispensaryService.getDispensariesByIds(user.dispensaryIds).then(setDispensaries);
    } else {
      DispensaryService.getAllDispensaries().then(setDispensaries);
    }
  }, []);

  useEffect(() => {
    if (filters.dispensaryId && filters.dispensaryId !== 'all') {
      DoctorService.getDoctorsByDispensaryId(filters.dispensaryId).then(setDoctors);
    } else {
      setDoctors([]);
      if (filters.doctorId !== 'all') {
        onFilterChange({ ...filters, doctorId: 'all' });
      }
    }
  }, [filters.dispensaryId]);

  const update = (partial: Partial<FilterState>) => {
    onFilterChange({ ...filters, ...partial });
  };

  const handlePeriodChange = (period: Period) => {
    const dates = getDefaultDates(period);
    update({ period, ...dates });
  };

  const startDate = new Date(filters.startDate + 'T12:00:00');
  const endDate = new Date(filters.endDate + 'T12:00:00');
  const isDaily = filters.period === 'daily';

  return (
    <div className="space-y-4">
      {/* Period tabs */}
      <Tabs value={filters.period} onValueChange={(v) => handlePeriodChange(v as Period)}>
        <TabsList className="grid w-full grid-cols-3 max-w-sm">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Date pickers */}
        {isDaily ? (
          /* Single date picker for daily */
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal h-9">
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {format(startDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => {
                    if (!d) return;
                    const formatted = format(d, 'yyyy-MM-dd');
                    update({ startDate: formatted, endDate: formatted });
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          /* Start + End date pickers for weekly/monthly */
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start text-left font-normal h-9">
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {format(startDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => {
                      if (!d) return;
                      const formatted = format(d, 'yyyy-MM-dd');
                      if (formatted > filters.endDate) {
                        update({ startDate: formatted, endDate: formatted });
                      } else {
                        update({ startDate: formatted });
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start text-left font-normal h-9">
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {format(endDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => {
                      if (!d) return;
                      const formatted = format(d, 'yyyy-MM-dd');
                      if (formatted < filters.startDate) {
                        update({ startDate: formatted, endDate: formatted });
                      } else {
                        update({ endDate: formatted });
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}

        {/* Dispensary */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Dispensary</label>
          <Select value={filters.dispensaryId} onValueChange={(v) => update({ dispensaryId: v })}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="All Dispensaries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dispensaries</SelectItem>
              {dispensaries.map(d => (
                <SelectItem key={d._id || d.id} value={d._id || d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Doctor */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Doctor</label>
          <Select value={filters.doctorId} onValueChange={(v) => update({ doctorId: v })} disabled={!doctors.length}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="All Doctors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors</SelectItem>
              {doctors.map(d => (
                <SelectItem key={d._id || d.id} value={d._id || d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={filters.status} onValueChange={(v) => update({ status: v })}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
