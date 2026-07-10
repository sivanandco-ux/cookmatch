import EducationChat from '@/components/EducationChat'
import BecomeCookTimeline from '@/components/BecomeCookTimeline'

export default function BecomeACookPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Two Paths to Become a Cook</h1>
        <p className="text-sm text-gray-500 mt-1">What each path looks like step by step, from getting started to your first booking.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <BecomeCookTimeline />
      </div>

      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl p-6">
        <EducationChat />
      </div>
    </div>
  )
}
