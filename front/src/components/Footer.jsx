import React from 'react';

export default function Footer() {
  return (
    <footer className="site-footer">
      {/* Overlapping Left Logo */}
      <div className="footer-logo-container">
        <img src="/Untitled-1.png?v=3" alt="ON AIR" className="footer-logo-img" />
      </div>

      <div className="container-fluid d-flex justify-content-between align-items-center py-3">
        {/* Center Text */}
        <div className="footer-text mx-auto">
          جميع الحقوق محفوظة © كنيسة السيدة العذراء مريم والشهيد ابو سيفين
        </div>
      </div>
    </footer>
  );
}
