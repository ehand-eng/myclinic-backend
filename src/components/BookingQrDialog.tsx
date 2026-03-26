import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QrCode } from 'lucide-react';

interface BookingQrData {
  bookingId: string;
  transactionId: string;
  phone: string;
  doctor: string;
  dispensary: string;
  date: string;
  time: string;
  aptNo: number | string;
  estTime: string;
}

interface BookingQrDialogProps {
  open: boolean;
  onClose: () => void;
  data: BookingQrData;
}

const BookingQrDialog = ({ open, onClose, data }: BookingQrDialogProps) => {
  const qrValue = JSON.stringify(data);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center text-lg">
            <QrCode className="h-5 w-5 text-[#1977cc]" />
            Booking QR Code
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <p className="text-sm text-gray-500">#{data.transactionId}</p>
          <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm">
            <QRCodeSVG
              value={qrValue}
              size={220}
              level="M"
              bgColor="#ffffff"
              fgColor="#1e293b"
            />
          </div>
          <p className="text-xs text-gray-400">Scan this code at the dispensary</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingQrDialog;
export type { BookingQrData };
