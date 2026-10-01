'use client'

export default function UploadTestPage() {
  return (
    <div className="p-10">
      <h1 className="mb-6 text-2xl font-bold">
        Upload Test
      </h1>

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
      />
    </div>
  )
}