const AdminFooter = () => {
  return (
    <footer className="bg-gradient-to-r from-medicalGray-800 to-medicalBlue-900 text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-medicalGray-300 text-sm">
            &copy; {new Date().getFullYear()} DocSpot Connect Admin Panel. All rights reserved.
          </p>
          <p className="text-medicalGray-400 text-xs mt-2">
            Empowering healthcare management through technology
          </p>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;

