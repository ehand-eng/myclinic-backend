
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ReportService } from '@/api/services/ReportService';
import { ReportType } from '@/api/models';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ReportDetailGenerator from './ReportDetailGenerator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Printer } from 'lucide-react';

const ReportGenerator = () => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 7));
  const [reportData, setReportData] = useState<any>(null);
  
  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type);
    // Reset report data when changing report type
    setReportData(null);
  };
  
  const handleGenerateReport = async () => {
    if (!reportType) {
      toast({
        title: "Error",
        description: "Please select a report type.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Get current user from local storage
      const userJson = localStorage.getItem('current_user');
      if (!userJson) {
        throw new Error("User not found");
      }
      const currentUser = JSON.parse(userJson);
      
      // Generate report
      const report = await ReportService.generateReport(
        reportType,
        `${reportType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}`,
        { 
          reportType, 
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        },
        currentUser.id,
        undefined, // dispensaryId (optional)
        startDate,
        endDate
      );
      
      toast({
        title: "Success",
        description: "Report generated successfully."
      });
      
      setReportData(report.data);
      
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const reportTypes = [
    { value: ReportType.DAILY_BOOKINGS, label: 'Daily Bookings' },
    { value: ReportType.MONTHLY_SUMMARY, label: 'Monthly Summary' },
    { value: ReportType.DOCTOR_PERFORMANCE, label: 'Doctor Performance' },
    { value: ReportType.DISPENSARY_REVENUE, label: 'Dispensary Revenue' },
  ];

  const handleExport = () => {
    toast({
      title: "Export initiated",
      description: "Your report is being prepared for download."
    });
    // In a real app, this would trigger a download of CSV/Excel/PDF
  };

  const handlePrint = () => {
    window.print();
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch(reportType) {
      case ReportType.DAILY_BOOKINGS:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-medium">Daily Bookings Report</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{reportData.totalBookings}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{reportData.completedBookings}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Cancelled/No-show</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">{reportData.cancelledBookings + reportData.noShowBookings}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Bookings by Doctor</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.bookingsByDoctor?.map((item: any) => (
                      <TableRow key={item.doctorId}>
                        <TableCell>{item.doctorName}</TableCell>
                        <TableCell className="text-right">{item.bookings}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      case ReportType.MONTHLY_SUMMARY:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-medium">Monthly Summary Report</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{reportData.totalBookings}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{reportData.completedBookings}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Cancelled</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">{reportData.cancelledBookings}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">${reportData.revenue?.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Popular Doctors</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Doctor</TableHead>
                        <TableHead className="text-right">Bookings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.popularDoctors?.map((item: any) => (
                        <TableRow key={item.doctorId}>
                          <TableCell>{item.doctorName}</TableCell>
                          <TableCell className="text-right">{item.bookings}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case ReportType.DOCTOR_PERFORMANCE:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-medium">Doctor Performance Report</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Doctor Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead className="text-right">Total Patients</TableHead>
                      <TableHead className="text-right">Avg. Rating</TableHead>
                      <TableHead className="text-right">Completion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.doctors?.map((doctor: any) => (
                      <TableRow key={doctor.doctorId}>
                        <TableCell>{doctor.doctorName}</TableCell>
                        <TableCell className="text-right">{doctor.totalPatients}</TableCell>
                        <TableCell className="text-right">{doctor.avgRating.toFixed(1)}/5.0</TableCell>
                        <TableCell className="text-right">{doctor.completionRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      case ReportType.DISPENSARY_REVENUE:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-medium">Dispensary Revenue Report</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600">${reportData.totalRevenue?.toLocaleString()}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.revenueByService?.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.service}</TableCell>
                          <TableCell className="text-right">${item.revenue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Doctor</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Doctor</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.revenueByDoctor?.map((item: any) => (
                        <TableRow key={item.doctorId}>
                          <TableCell>{item.doctorName}</TableCell>
                          <TableCell className="text-right">${item.revenue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return <p>Select a report type and generate a report to view data.</p>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="summary">Summary Reports</TabsTrigger>
          <TabsTrigger value="session">Session Reports</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Summary Report</CardTitle>
              <CardDescription>
                Select parameters to generate a customized report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={reportType} onValueChange={(value) => handleReportTypeChange(value as ReportType)}>
                  <SelectTrigger className="w-full" id="reportType">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="startDate" className="text-xs mb-1 block">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                          id="startDate"
                        >
                          {format(startDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => date && setStartDate(date)}
                          initialFocus
                          className="rounded-xl border border-medicalGreen-200 shadow-lg medical-card"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="flex-1">
                    <Label htmlFor="endDate" className="text-xs mb-1 block">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                          id="endDate"
                        >
                          {format(endDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => date && setEndDate(date)}
                          initialFocus
                          className="rounded-xl border border-medicalGreen-200 shadow-lg medical-card"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateReport}
                disabled={!reportType || isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </Button>
            </CardFooter>
          </Card>

          {reportData && (
            <Card className="p-6">
              {renderReportContent()}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="session" className="mt-4">
          <ReportDetailGenerator />
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>
                View and download previously generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Report Type</TableHead>
                    <TableHead>Generated By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* This would fetch from report history in a real implementation */}
                  <TableRow>
                    <TableCell>{format(new Date(), "PPP")}</TableCell>
                    <TableCell>Daily Bookings</TableCell>
                    <TableCell>Admin User</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">
                        <FileText className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{format(addDays(new Date(), -1), "PPP")}</TableCell>
                    <TableCell>Monthly Summary</TableCell>
                    <TableCell>Admin User</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">
                        <FileText className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportGenerator;
