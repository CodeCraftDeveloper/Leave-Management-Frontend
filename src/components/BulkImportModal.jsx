import { useRef, useState } from 'react';
import {
  FiDownload,
  FiUploadCloud,
  FiFileText,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { downloadEmployeeImportTemplate, importEmployees } from '../services/adminService';

// Column helper — mirrors the server's IMPORT_COLUMNS so admins can see exactly
// what each column means without opening the template.
const COLUMN_HELP = [
  { header: 'Employee ID', required: true, description: 'Unique staff ID. Auto-uppercased. Must not already exist.' },
  { header: 'Name', required: true, description: 'Full name of the employee.' },
  { header: 'Email', required: false, description: 'Login email. Optional, but must be unique when provided.' },
  { header: 'Phone', required: false, description: 'Contact number.' },
  { header: 'Department', required: true, description: 'Must match an existing department (see the Departments tab).' },
  { header: 'Designation', required: false, description: 'Job title. Defaults to "Employee" when blank.' },
  { header: 'Password', required: false, description: 'Initial password (min 6). Auto-generated if blank — shown in results.' },
  { header: 'Joining Date', required: false, description: 'Date of joining, YYYY-MM-DD.' },
  { header: 'Role', required: false, description: 'employee or head. Only the super admin can create heads.' },
  { header: 'Reporting Head Emails', required: false, description: 'Comma-separated Head routing emails (see the Heads tab). Left blank, a head’s import routes to that head automatically.' },
];

export default function BulkImportModal({ open, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setImporting(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const close = () => {
    reset();
    onClose();
  };

  const pickFile = (event) => {
    const selected = event.target.files?.[0] || null;
    if (selected && !selected.name.toLowerCase().endsWith('.xlsx')) {
      toast.error('Please choose an .xlsx file');
      return;
    }
    setFile(selected);
    setResult(null);
  };

  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      await downloadEmployeeImportTemplate();
    } catch {
      /* interceptor surfaces the error toast */
    } finally {
      setDownloading(false);
    }
  };

  const runImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const data = await importEmployees(file);
      setResult(data);
      const { created = 0, failed = 0 } = data.summary || {};
      if (created && !failed) toast.success(`Imported ${created} employee(s)`);
      else if (created) toast.success(`Imported ${created}, ${failed} row(s) need attention`);
      else toast.error('No rows were imported — check the results below');
      if (created) onImported?.();
    } catch {
      /* interceptor surfaces the error toast */
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Bulk Import Employees" size="lg">
      {result ? (
        <ResultView result={result} onReset={reset} onDone={close} />
      ) : (
        <div className="space-y-5">
          <ol className="space-y-3">
            <li className="flex gap-3">
              <StepDot n={1} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Download the template</p>
                <p className="text-xs text-on-surface-variant mb-2">
                  It includes an Instructions tab, a Departments dropdown and two example rows.
                </p>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  disabled={downloading}
                  className="btn-outline text-xs sm:text-sm px-3 py-2"
                >
                  <FiDownload /> {downloading ? 'Preparing…' : 'Download Template'}
                </button>
              </div>
            </li>

            <li className="flex gap-3">
              <StepDot n={2} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Fill in one row per employee</p>
                <ColumnHelp />
              </div>
            </li>

            <li className="flex gap-3">
              <StepDot n={3} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Upload the completed file</p>
                <p className="text-xs text-on-surface-variant mb-2">Accepted format: .xlsx (max 10 MB, up to 1000 rows).</p>
                <FilePicker file={file} inputRef={inputRef} onPick={pickFile} />
              </div>
            </li>
          </ol>

          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-2 text-xs">
              <FiInfo className="shrink-0" />
              <span>Remember to delete the grey example rows before importing.</span>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 px-3 py-2 text-xs">
              <FiInfo className="shrink-0 mt-0.5" />
              <span>
                Reporting heads decide who approves each employee’s leave. Fill in
                <strong> Reporting Head Emails</strong> from the template’s Heads tab. If you’re a
                head and leave it blank, imported staff route to you automatically.
              </span>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={close} className="btn-outline text-sm">Cancel</button>
            <button
              type="button"
              onClick={runImport}
              disabled={!file || importing}
              className="btn-primary text-sm px-5 h-11"
            >
              {importing ? 'Importing…' : 'Import'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function StepDot({ n }) {
  return (
    <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary grid place-items-center text-xs font-bold">
      {n}
    </span>
  );
}

function ColumnHelp() {
  return (
    <div className="mt-1 rounded-xl border border-outline-variant/50 overflow-hidden">
      <div className="max-h-52 overflow-y-auto overflow-x-auto">
        <table className="w-full text-left text-[11px] sm:text-xs">
          <thead className="bg-surface-container-low sticky top-0">
            <tr className="text-on-surface-variant">
              <th className="px-2.5 py-1.5 font-semibold">Column</th>
              <th className="px-2.5 py-1.5 font-semibold whitespace-nowrap">Required</th>
              <th className="px-2.5 py-1.5 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {COLUMN_HELP.map((col) => (
              <tr key={col.header} className="border-t border-outline-variant/30 align-top">
                <td className="px-2.5 py-1.5 font-medium whitespace-nowrap">{col.header}</td>
                <td className="px-2.5 py-1.5">
                  {col.required ? (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">Required</span>
                  ) : (
                    <span className="text-on-surface-variant/70">Optional</span>
                  )}
                </td>
                <td className="px-2.5 py-1.5 text-on-surface-variant">{col.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilePicker({ file, inputRef, onPick }) {
  return (
    <label className="block cursor-pointer">
      <input ref={inputRef} type="file" accept=".xlsx" onChange={onPick} className="hidden" />
      <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary transition px-4 py-4">
        {file ? (
          <>
            <FiFileText className="text-primary text-xl shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-on-surface-variant">Click to choose a different file</p>
            </div>
          </>
        ) : (
          <>
            <FiUploadCloud className="text-on-surface-variant text-xl shrink-0" />
            <div>
              <p className="text-sm font-medium">Choose .xlsx file</p>
              <p className="text-xs text-on-surface-variant">or drag it onto this area</p>
            </div>
          </>
        )}
      </div>
    </label>
  );
}

function ResultView({ result, onReset, onDone }) {
  const { summary = {}, results = [] } = result;
  const { total = 0, created = 0, failed = 0, truncated } = summary;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <SummaryTile label="Processed" value={total} tone="neutral" />
        <SummaryTile label="Created" value={created} tone="success" />
        <SummaryTile label="Failed" value={failed} tone="error" />
      </div>

      {truncated && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-2 text-xs">
          <FiAlertTriangle className="shrink-0" />
          <span>Only the first 1000 rows were processed. Split larger files and import again.</span>
        </div>
      )}

      <div className="rounded-xl border border-outline-variant/50 overflow-hidden">
        <div className="max-h-72 overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-[11px] sm:text-xs">
            <thead className="bg-surface-container-low sticky top-0">
              <tr className="text-on-surface-variant">
                <th className="px-2.5 py-1.5 font-semibold">Row</th>
                <th className="px-2.5 py-1.5 font-semibold">Employee ID</th>
                <th className="px-2.5 py-1.5 font-semibold">Name</th>
                <th className="px-2.5 py-1.5 font-semibold">Result</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row) => (
                <tr key={row.row} className="border-t border-outline-variant/30 align-top">
                  <td className="px-2.5 py-1.5 text-on-surface-variant">{row.row}</td>
                  <td className="px-2.5 py-1.5 font-medium whitespace-nowrap">{row.employeeId || '—'}</td>
                  <td className="px-2.5 py-1.5 whitespace-nowrap">{row.name || '—'}</td>
                  <td className="px-2.5 py-1.5">
                    {row.status === 'created' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <FiCheckCircle className="shrink-0" />
                        <span>
                          {row.message}
                          {row.password ? (
                            <>
                              {' — '}
                              <code className="px-1 py-0.5 rounded bg-surface-container-low text-on-surface">{row.password}</code>
                            </>
                          ) : null}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <FiAlertTriangle className="shrink-0" /> {row.message}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {created > 0 && (
        <p className="text-xs text-on-surface-variant">
          Auto-generated passwords are shown only in this report. Copy any you need before closing.
        </p>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onReset} className="btn-outline text-sm">Import Another</button>
        <button type="button" onClick={onDone} className="btn-primary text-sm px-5 h-11">Done</button>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, tone }) {
  const tones = {
    neutral: 'bg-surface-container-low text-on-surface',
    success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    error: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300',
  };
  return (
    <div className={`rounded-xl px-3 py-3 text-center ${tones[tone]}`}>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-[11px] mt-1">{label}</p>
    </div>
  );
}
