import { useState } from 'react';
import GlassModal from '../ui/GlassModal';
import GlassButton from '../ui/GlassButton';
import GlassCard from '../ui/GlassCard';
import Icon from '../ui/Icon';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useImportContacts } from '../../services/queries';
import { useToastContext } from '../../contexts/ToastContext';

export default function ImportContactsModal({ isOpen, onClose }) {
  const toast = useToastContext();
  const importContacts = useImportContacts();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false); // Collapsed by default

  // Generate sample CSV content
  const generateSampleCSV = () => {
    const sampleData = [
      ['phoneE164', 'firstName', 'lastName', 'email', 'gender', 'birthDate', 'smsConsent', 'tags'],
      ['+306977123456', 'John', 'Doe', 'john.doe@example.com', 'male', '1990-05-15', 'opted_in', 'VIP,Customer'],
      ['+306977123457', 'Jane', 'Smith', 'jane.smith@example.com', 'female', '1985-08-22', 'opted_in', 'Customer'],
      ['+306977123458', 'Alex', 'Johnson', '', 'other', '', 'opted_in', ''],
      ['+306977123459', 'Maria', 'Garcia', 'maria@example.com', 'female', '1992-12-01', 'opted_out', 'Newsletter'],
    ];
    return sampleData.map(row => row.join(',')).join('\n');
  };

  const downloadSampleCSV = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample-contacts.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample CSV file downloaded');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  // Parse CSV file to JSON (handles quoted fields and commas)
  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row');
    }

    // Simple CSV parser that handles quoted fields
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"';
            i++; // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // Field separator
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim()); // Add last field
      return result;
    };

    // Parse header row
    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
    const phoneE164Index = headers.findIndex(h => h.toLowerCase() === 'phonee164');
    
    if (phoneE164Index === -1) {
      throw new Error('CSV file must contain a "phoneE164" column');
    }

    // Parse data rows
    const contacts = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = parseCSVLine(line).map(v => v.replace(/^"|"$/g, '').trim());
        
        // Skip if phone is missing
        if (!values[phoneE164Index] || values[phoneE164Index] === '') {
          errors.push(`Row ${i + 1}: Missing phone number`);
          continue;
        }

        const contact = {};
        headers.forEach((header, index) => {
          const value = values[index] || '';
          const headerLower = header.toLowerCase();
          
          // Handle different field names (case-insensitive, supports snake_case)
          if (headerLower === 'phonee164' || headerLower === 'phone') {
            contact.phoneE164 = value;
          } else if (headerLower === 'firstname' || headerLower === 'first_name') {
            contact.firstName = value || null;
          } else if (headerLower === 'lastname' || headerLower === 'last_name') {
            contact.lastName = value || null;
          } else if (headerLower === 'email') {
            contact.email = value || null;
          } else if (headerLower === 'gender') {
            contact.gender = value || null;
          } else if (headerLower === 'birthdate' || headerLower === 'birth_date') {
            contact.birthDate = value || null;
          } else if (headerLower === 'smsconsent' || headerLower === 'sms_consent') {
            contact.smsConsent = value || 'unknown';
          } else if (headerLower === 'tags') {
            contact.tags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];
          }
        });

        contacts.push(contact);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message || 'Parse error'}`);
      }
    }

    if (contacts.length === 0) {
      throw new Error('No valid contacts found in CSV file. Please check the format.');
    }

    if (contacts.length > 1000) {
      throw new Error('Maximum 1000 contacts per import. Please split your file.');
    }

    return { contacts, errors };
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a CSV file to import');
      return;
    }

    setIsUploading(true);
    try {
      // Read and parse CSV file
      const fileText = await file.text();
      const { contacts, errors } = parseCSV(fileText);

      // Show warnings for parsing errors
      if (errors.length > 0) {
        toast.error(`${errors.length} row(s) had errors. Check the console for details.`);
        console.warn('CSV parsing errors:', errors);
      }

      // Send parsed contacts as JSON
      const result = await importContacts.mutateAsync({ contacts });
      
      const imported = result.data?.created || result.created || 0;
      const updated = result.data?.updated || result.updated || 0;
      const skipped = result.data?.skipped || result.skipped || 0;
      
      let message = `Successfully imported ${imported} contact${imported !== 1 ? 's' : ''}`;
      if (updated > 0) {
        message += `, updated ${updated}`;
      }
      if (skipped > 0) {
        message += `, skipped ${skipped}`;
      }
      
      toast.success(message);
      
      // Reset and close
      setFile(null);
      setFileName('');
      onClose();
    } catch (error) {
      toast.error(error?.message || 'Failed to import contacts. Please check your CSV format.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setFileName('');
      onClose();
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Contacts"
      size="md"
    >
      <div className="space-y-4">
        {/* Instructions Toggle */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-border/60">
          <h3 className="text-base font-semibold text-neutral-text-primary">Import Instructions</h3>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="p-2 rounded-lg hover:bg-neutral-surface-secondary transition-colors"
            aria-label={showInstructions ? 'Hide instructions' : 'Show instructions'}
          >
            <Icon 
              name="arrowRight" 
              size="sm" 
              variant="ice"
              className={`transition-transform ${showInstructions ? 'rotate-90' : '-rotate-90'}`}
            />
          </button>
        </div>

        {/* Step-by-Step Instructions */}
        {showInstructions && (
          <GlassCard className="p-3 sm:p-4 space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-neutral-text-primary mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-ice-primary text-primary-dark text-xs font-bold">1</span>
                  Prepare Your CSV File
                </h4>
                <p className="text-xs text-neutral-text-secondary ml-7 mb-2">
                  Create a CSV file with the following columns. The first row should contain column headers.
                </p>
                
                {/* Field Requirements Table */}
                <div className="ml-7 overflow-x-auto -mx-2">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-border/60">
                        <th className="text-left py-1.5 px-2 font-semibold text-neutral-text-primary text-xs">Column</th>
                        <th className="text-left py-1.5 px-2 font-semibold text-neutral-text-primary text-xs">Required</th>
                        <th className="text-left py-1.5 px-2 font-semibold text-neutral-text-primary text-xs">Format</th>
                        <th className="text-left py-1.5 px-2 font-semibold text-neutral-text-primary text-xs">Example</th>
                      </tr>
                    </thead>
                    <tbody className="text-neutral-text-secondary">
                      <tr className="border-b border-neutral-border/30">
                        <td className="py-1.5 px-2 font-medium text-neutral-text-primary text-xs">phoneE164</td>
                        <td className="py-1.5 px-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600">Required</span>
                        </td>
                        <td className="py-1.5 px-2 text-xs">E.164</td>
                        <td className="py-1.5 px-2 font-mono text-[10px]">+306977123456</td>
                      </tr>
                      <tr className="border-b border-neutral-border/30">
                        <td className="py-1.5 px-2 font-medium text-neutral-text-primary text-xs">firstName</td>
                        <td className="py-1.5 px-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-surface-secondary text-neutral-text-secondary">Optional</span>
                        </td>
                        <td className="py-1.5 px-2 text-xs">Text</td>
                        <td className="py-1.5 px-2 text-xs">John</td>
                      </tr>
                      <tr className="border-b border-neutral-border/30">
                        <td className="py-1.5 px-2 font-medium text-neutral-text-primary text-xs">lastName</td>
                        <td className="py-1.5 px-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-surface-secondary text-neutral-text-secondary">Optional</span>
                        </td>
                        <td className="py-1.5 px-2 text-xs">Text</td>
                        <td className="py-1.5 px-2 text-xs">Doe</td>
                      </tr>
                      <tr className="border-b border-neutral-border/30">
                        <td className="py-1.5 px-2 font-medium text-neutral-text-primary text-xs">email</td>
                        <td className="py-1.5 px-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-surface-secondary text-neutral-text-secondary">Optional</span>
                        </td>
                        <td className="py-1.5 px-2 text-xs">Email</td>
                        <td className="py-1.5 px-2 text-xs">john@example.com</td>
                      </tr>
                      <tr className="border-b border-neutral-border/30">
                        <td className="py-1.5 px-2 font-medium text-neutral-text-primary text-xs">gender</td>
                        <td className="py-1.5 px-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-surface-secondary text-neutral-text-secondary">Optional</span>
                        </td>
                        <td className="py-1.5 px-2 text-xs">male/female/other</td>
                        <td className="py-1.5 px-2 text-xs">male</td>
                      </tr>
                      <tr className="border-b border-neutral-border/30">
                        <td className="py-1.5 px-2 font-medium text-neutral-text-primary text-xs">birthDate</td>
                        <td className="py-1.5 px-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-surface-secondary text-neutral-text-secondary">Optional</span>
                        </td>
                        <td className="py-1.5 px-2 text-xs">YYYY-MM-DD</td>
                        <td className="py-1.5 px-2 font-mono text-[10px]">1990-05-15</td>
                      </tr>
                      <tr className="border-b border-neutral-border/30">
                        <td className="py-1.5 px-2 font-medium text-neutral-text-primary text-xs">smsConsent</td>
                        <td className="py-1.5 px-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-surface-secondary text-neutral-text-secondary">Optional</span>
                        </td>
                        <td className="py-1.5 px-2 text-xs">opted_in/out/unknown</td>
                        <td className="py-1.5 px-2 text-xs">opted_in</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-medium text-neutral-text-primary text-xs">tags</td>
                        <td className="py-1.5 px-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-surface-secondary text-neutral-text-secondary">Optional</span>
                        </td>
                        <td className="py-1.5 px-2 text-xs">Comma-separated</td>
                        <td className="py-1.5 px-2 text-xs">VIP,Customer</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-neutral-text-primary mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-ice-primary text-primary-dark text-xs font-bold">2</span>
                  Download Sample File
                </h4>
                <div className="ml-7 space-y-2">
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={downloadSampleCSV}
                    className="min-h-[36px] text-xs"
                  >
                    <span className="flex items-center gap-2">
                      <Icon name="export" size="xs" variant="ice" />
                      Download Sample CSV
                    </span>
                  </GlassButton>
                  <div className="bg-neutral-surface-secondary/50 rounded-lg p-2 border border-neutral-border/30">
                    <p className="text-[10px] font-mono text-neutral-text-secondary whitespace-pre-wrap leading-tight">
{`phoneE164,firstName,lastName,email,gender,birthDate,smsConsent,tags
+306977123456,John,Doe,john@example.com,male,1990-05-15,opted_in,"VIP,Customer"`}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-neutral-text-primary mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-ice-primary text-primary-dark text-xs font-bold">3</span>
                  Important Notes
                </h4>
                <ul className="ml-7 space-y-1 text-xs text-neutral-text-secondary list-disc list-inside">
                  <li><strong>Phone:</strong> E.164 format required (e.g., +306977123456)</li>
                  <li><strong>Column names:</strong> Case-insensitive, supports camelCase/snake_case</li>
                  <li><strong>Max 1000 contacts</strong> per import</li>
                  <li><strong>Duplicates:</strong> Existing contacts will be updated</li>
                  <li><strong>Tags:</strong> Comma-separated (e.g., "VIP,Customer")</li>
                  <li><strong>Dates:</strong> YYYY-MM-DD format (e.g., 1990-05-15)</li>
                  <li><strong>Consent:</strong> opted_in, opted_out, or unknown (defaults to unknown)</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        )}

        {/* File Upload Section */}
        <div>
          <label className="block text-sm font-medium text-neutral-text-primary mb-2">
            CSV File
          </label>
          <div className="flex items-center gap-4">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
              />
              <div className="px-4 py-3 rounded-xl bg-neutral-surface-primary backdrop-blur-[24px] border border-neutral-border/60 hover:border-ice-primary transition-colors flex items-center justify-between min-h-[44px] spring-smooth shadow-sm">
                <span className="text-sm text-neutral-text-primary">
                  {fileName || 'Choose CSV file...'}
                </span>
                <Icon name="import" size="sm" variant="ice" />
              </div>
            </label>
          </div>
          {file && (
            <p className="mt-2 text-xs text-ice-primary flex items-center gap-1">
              <Icon name="check" size="xs" variant="ice" />
              Selected: {fileName} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <div className="flex gap-4 pt-4 border-t border-neutral-border/60">
          <GlassButton
            variant="ghost"
            size="lg"
            onClick={handleClose}
            disabled={isUploading}
            className="flex-1"
          >
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            size="lg"
            onClick={handleImport}
            disabled={!file || isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Importing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Icon name="import" size="sm" variant="ice" />
                Import Contacts
              </span>
            )}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}

