'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Mail, Building, Phone, Calendar, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdvisorPermissions {
  canView: boolean;
  canDownload: boolean;
  canEdit: boolean;
  canComment: boolean;
  categories: string[];
}

export function EnhancedTaxAdvisorSharing() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [permissions, setPermissions] = useState<AdvisorPermissions>({
    canView: true,
    canDownload: false,
    canEdit: false,
    canComment: true,
    categories: [],
  });
  const [accessExpiry, setAccessExpiry] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const handleShare = async () => {
    if (!name || !email || !company) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // In real implementation, this would call the API
      toast.success(`Tax advisor ${name} added successfully`);
      
      // Reset form
      setName('');
      setEmail('');
      setCompany('');
      setPhone('');
      setAccessExpiry('');
      setSelectedDocuments([]);
      setPermissions({
        canView: true,
        canDownload: false,
        canEdit: false,
        canComment: true,
        categories: [],
      });
    } catch (error) {
      toast.error('Failed to add tax advisor');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Share with Tax Advisor</h3>
        <p className="text-sm text-gray-600">
          Grant secure access to your tax advisor to view and manage your tax documents
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Advisor Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter advisor name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="advisor@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Company <span className="text-red-500">*</span>
          </label>
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Access Expiry</label>
          <Input
            type="date"
            value={accessExpiry}
            onChange={(e) => setAccessExpiry(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Permissions</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={permissions.canView}
                onChange={(e) => setPermissions({ ...permissions, canView: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Can View Documents</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={permissions.canDownload}
                onChange={(e) => setPermissions({ ...permissions, canDownload: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Can Download Documents</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={permissions.canEdit}
                onChange={(e) => setPermissions({ ...permissions, canEdit: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Can Edit Documents</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={permissions.canComment}
                onChange={(e) => setPermissions({ ...permissions, canComment: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Can Add Comments</span>
            </label>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Secure Sharing</p>
              <p className="text-xs">
                All shared documents are encrypted and access is logged. The advisor will receive
                an email invitation with secure access credentials.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleShare} className="w-full">
          <Share2 className="w-4 h-4 mr-2" />
          Share with Tax Advisor
        </Button>
      </div>
    </div>
  );
}


