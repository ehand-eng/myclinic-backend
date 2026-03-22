const AdminFooter = () => {
  return (
    <footer className="bg-medicalBlue-800 text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-white/70 text-sm">
            &copy; {new Date().getFullYear()} MyClinic Admin Panel. All rights reserved.
          </p>
          <p className="text-white/50 text-xs mt-2">
            Empowering healthcare management through technology
          </p>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;

