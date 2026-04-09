import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mocking the fetch since we don't have a reliable certifications table setup with expiration dates in the DB yet
const CertificationExpirationWidget = ({ certifications, onPay }) => {
  const [expiringCerts, setExpiringCerts] = useState([]);

  useEffect(() => {
    if (!certifications) return;
    
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const expiring = certifications.filter(cert => {
      if (!cert.expiryDate) return false;
      const expiry = new Date(cert.expiryDate);
      return expiry <= thirtyDaysFromNow && expiry >= now && !cert.isPaid;
    });

    setExpiringCerts(expiring);
  }, [certifications]);

  if (!expiringCerts || expiringCerts.length === 0) return null;

  return (
    <div className="bg-card border border-orange-200/50 rounded-xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
      <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        Vencimientos Próximos
      </h3>
      <div className="space-y-3">
        {expiringCerts.map(cert => {
          const daysLeft = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
          const isUrgent = daysLeft <= 7;

          return (
            <div key={cert.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">{cert.name}</p>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className={`inline-flex items-center gap-1 font-medium ${isUrgent ? 'text-red-500' : 'text-orange-500'}`}>
                    <Clock className="w-3 h-3" />
                    Faltan {daysLeft} días
                  </span>
                  <span className="text-muted-foreground">- {cert.amount?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) || '0,00 €'}</span>
                </div>
              </div>
              <Button size="sm" onClick={() => onPay(cert)} className={isUrgent ? "bg-red-600 hover:bg-red-700 text-white" : ""}>
                Pagar Ahora
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CertificationExpirationWidget;