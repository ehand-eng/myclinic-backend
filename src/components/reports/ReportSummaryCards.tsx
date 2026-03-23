import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarCheck, CheckCircle, Clock, XCircle, AlertTriangle, Calendar, DollarSign, Stethoscope, Building2, Percent, Users } from 'lucide-react';
import { ComprehensiveReportResponse } from '@/api/services/ReportService';

interface Props {
  data: ComprehensiveReportResponse;
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ReportSummaryCards: React.FC<Props> = ({ data }) => {
  const { summary, revenue } = data;

  const bookingCards = [
    { label: 'Total Bookings', value: summary.total, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed', value: summary.completed, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Scheduled', value: summary.scheduled, icon: CalendarCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Checked In', value: summary.checkedIn, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Cancelled', value: summary.cancelled, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'No Show', value: summary.noShow, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const revenueCards = [
    { label: 'Total Fee', value: `Rs. ${fmt(revenue.totalFee)}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Doctor Fee', value: `Rs. ${fmt(revenue.doctorFee)}`, icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Dispensary Fee', value: `Rs. ${fmt(revenue.dispensaryFee)}`, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Commission', value: `Rs. ${fmt(revenue.bookingCommission)}`, icon: Percent, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'CP Fee', value: `Rs. ${fmt(revenue.channelPartnerFee)}`, icon: Users, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Realized Revenue', value: `Rs. ${fmt(revenue.realizedRevenue)}`, icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-4">
      {/* Booking stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {bookingCards.map(c => (
          <Card key={c.label} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${c.bg}`}>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-xl font-bold">{c.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {revenueCards.map(c => (
          <Card key={c.label} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${c.bg}`}>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-lg font-bold">{c.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportSummaryCards;
