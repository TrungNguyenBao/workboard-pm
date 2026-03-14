import { useRef, useState } from 'react'
import { CheckCircle, Upload, XCircle } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useCreateImport, useImportJobs, type ImportJob } from '../hooks/use-import'

type Step = 'upload' | 'confirm' | 'result'
type EntityType = 'lead' | 'contact'

export default function ImportWizardPage() {
  const wsId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? ''
  const [step, setStep] = useState<Step>('upload')
  const [entityType, setEntityType] = useState<EntityType>('lead')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportJob | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const importMutation = useCreateImport(wsId)
  const { data: jobHistory = [] } = useImportJobs(wsId)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
  }

  function handleConfirm() {
    if (!selectedFile) return
    importMutation.mutate(
      { file: selectedFile, type: entityType },
      {
        onSuccess: (job) => {
          setResult(job)
          setStep('result')
        },
      },
    )
  }

  function handleReset() {
    setStep('upload')
    setSelectedFile(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold text-foreground">Import CSV</h2>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(['upload', 'confirm', 'result'] as Step[]).map((s, i) => (
          <span
            key={s}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="border border-border rounded-lg p-6 bg-card space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Entity Type</label>
            <div className="flex gap-3 mt-2">
              {(['lead', 'contact'] as EntityType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setEntityType(t)}
                  className={`px-4 py-2 rounded border text-sm font-medium ${
                    entityType === t
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/30'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}s
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">CSV File</label>
            <div
              className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/20"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              {selectedFile ? (
                <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Click to select CSV file</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {entityType === 'lead'
              ? 'Required columns: name. Optional: email, phone, source, status'
              : 'Required columns: name. Optional: email, phone, company'}
          </p>

          <button
            onClick={() => setStep('confirm')}
            disabled={!selectedFile}
            className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            Next: Confirm
          </button>
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 'confirm' && (
        <div className="border border-border rounded-lg p-6 bg-card space-y-4">
          <p className="text-sm text-foreground">
            Ready to import <strong>{selectedFile?.name}</strong> as{' '}
            <strong>{entityType}s</strong>.
          </p>
          <p className="text-xs text-muted-foreground">
            Duplicate emails will be skipped. Invalid rows will be logged.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setStep('upload')}
              className="px-4 py-2 rounded border border-border text-sm text-muted-foreground hover:bg-muted/30"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={importMutation.isPending}
              className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {importMutation.isPending ? 'Importing…' : 'Start Import'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 'result' && result && (
        <div className="border border-border rounded-lg p-6 bg-card space-y-4">
          <div className="flex items-center gap-2">
            {result.status === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <p className="text-sm font-medium text-foreground capitalize">{result.status}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{result.total_rows}</p>
              <p className="text-xs text-muted-foreground">Total Rows</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{result.imported_rows}</p>
              <p className="text-xs text-muted-foreground">Imported</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{result.failed_rows}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>
          {result.error_log && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">View errors</summary>
              <pre className="mt-2 bg-muted p-2 rounded overflow-x-auto">
                {JSON.stringify(result.error_log, null, 2)}
              </pre>
            </details>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded border border-border text-sm text-muted-foreground hover:bg-muted/30"
          >
            Import Another File
          </button>
        </div>
      )}

      {/* Import History */}
      {jobHistory.length > 0 && (
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium text-foreground mb-3">Import History</p>
          <div className="space-y-2">
            {jobHistory.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{job.file_name}</span>
                <span className="text-muted-foreground">{job.type}</span>
                <span
                  className={
                    job.status === 'completed'
                      ? 'text-green-600'
                      : job.status === 'failed'
                        ? 'text-red-500'
                        : 'text-muted-foreground'
                  }
                >
                  {job.imported_rows}/{job.total_rows}
                </span>
                <span className="text-muted-foreground capitalize">{job.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
