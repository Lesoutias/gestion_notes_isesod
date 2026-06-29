export function SuccessBanner({ message, onClose }) {
  if (!message) return null
  return (
    <div className="flex items-center justify-between rounded-xl border border-success-500/30 bg-success-500/10 px-4 py-3 text-sm text-success-500">
      <span>{message}</span>
      {onClose && (
        <button type="button" onClick={onClose} className="text-success-500 hover:underline">
          Fermer
        </button>
      )}
    </div>
  )
}
