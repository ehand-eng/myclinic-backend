
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { MapPin, Mail, Phone, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

const Contact = () => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: 'Message Sent!',
      description: 'We will get back to you soon.',
    });
    
    // Reset form
    setName('');
    setEmail('');
    setMessage('');
    setIsSubmitting(false);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <div className="bg-medicalBlue-50 border-b border-medicalBlue-100 py-10">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-medicalGray-900">Contact Us</h1>
            <p className="mt-2 text-medicalGray-600 text-lg">
              Get in touch with our team
            </p>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Get In Touch</h2>
              
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="medical-icon-bg">
                        <Mail className="h-6 w-6 text-medicalBlue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg mb-1">Email Us</h3>
                        <p className="text-gray-600 mb-2">We'll respond within 24 hours</p>
                        <a href="mailto:info@docspot-connect.com" className="text-medicalBlue-600 hover:underline">
                          info@docspot-connect.com
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="medical-icon-bg">
                        <Phone className="h-6 w-6 text-medicalBlue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg mb-1">Call Us</h3>
                        <p className="text-gray-600 mb-2">Mon-Fri from 9am to 6pm</p>
                        <a href="tel:+15551234567" className="text-medicalBlue-600 hover:underline">
                          +1 (555) 123-4567
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="medical-icon-bg">
                        <MapPin className="h-6 w-6 text-medicalBlue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg mb-1">Main Office</h3>
                        <p className="text-gray-600 mb-2">Visit our headquarters</p>
                        <address className="text-medicalBlue-600 not-italic">
                          123 Health Avenue, Medical District<br />
                          New York, NY 10001
                        </address>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="medical-icon-bg">
                        <Clock className="h-6 w-6 text-medicalBlue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg mb-1">Working Hours</h3>
                        <p className="text-gray-600 mb-2">When you can reach us</p>
                        <div className="space-y-1 text-medicalBlue-600">
                          <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                          <p>Saturday: 10:00 AM - 4:00 PM</p>
                          <p>Sunday: Closed</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
              
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input 
                        id="name"
                        placeholder="Enter your name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Your Email</Label>
                      <Input 
                        id="email"
                        type="email" 
                        placeholder="Enter your email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea 
                        id="message"
                        placeholder="How can we help you?" 
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
