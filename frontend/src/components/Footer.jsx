import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-6 text-center">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm">
            © 2025 Lumen Technologies. All Rights Reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-blue-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              Contact Support
            </a>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400">
          <p>
            Subscription Management System - Built with React & Node.js
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
