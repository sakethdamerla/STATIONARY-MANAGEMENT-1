import { useEffect, useState } from 'react';
import { Save, RefreshCcw } from 'lucide-react';
import { apiUrl } from '../utils/api';

const defaultSettings = {
  receiptHeader: 'PYDAH COLLEGE OF ENGINEERING',
  receiptSubheader: 'Stationery Management System',
};

const Settings = () => {
  const [form, setForm] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const response = await fetch(apiUrl('/api/settings'));
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setForm({
              receiptHeader: data.receiptHeader || defaultSettings.receiptHeader,
              receiptSubheader: data.receiptSubheader || defaultSettings.receiptSubheader,
            });
          }
        }
      } catch (error) {
        console.warn('Failed to load receipt settings:', error.message || error);
        if (isMounted) {
          setFeedback({ type: 'error', message: 'Could not load current settings. Please try again later.' });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (evt) => {
    const { name, value } = evt.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setForm(defaultSettings);
    setFeedback(null);
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(apiUrl('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update settings');
      }

      const data = await response.json();
      setForm({
        receiptHeader: data.receiptHeader || defaultSettings.receiptHeader,
        receiptSubheader: data.receiptSubheader || defaultSettings.receiptSubheader,
      });
      setFeedback({ type: 'success', message: 'Receipt settings updated successfully.' });
    } catch (error) {
      console.error('Error updating settings:', error);
      setFeedback({ type: 'error', message: error.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure the text that appears on receipt headers.</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="receiptHeader" className="text-sm font-semibold text-gray-800">
              Receipt Header Title
            </label>
            <input
              id="receiptHeader"
              name="receiptHeader"
              type="text"
              value={form.receiptHeader}
              onChange={handleChange}
              maxLength={120}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter the main title for receipt headers"
              required
            />
            <p className="text-xs text-gray-500">This appears in the top line of receipts and PDF reports.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="receiptSubheader" className="text-sm font-semibold text-gray-800">
              Receipt Subheader
            </label>
            <input
              id="receiptSubheader"
              name="receiptSubheader"
              type="text"
              value={form.receiptSubheader}
              onChange={handleChange}
              maxLength={160}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter the subtitle that appears below the header"
            />
            <p className="text-xs text-gray-500">Optional line shown beneath the main title.</p>
          </div>

          {feedback && (
            <div
              className={`px-4 py-3 rounded-lg text-sm font-medium border ${
                feedback.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition"
            >
              <RefreshCcw size={16} />
              Reset Defaults
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <section className="bg-white border border-blue-100 rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-blue-900 mb-3">Preview</h2>
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-xl p-6 text-center space-y-1">
            <p className="text-lg font-bold">{form.receiptHeader}</p>
            <p className="text-xs text-blue-100">{form.receiptSubheader || '—'}</p>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Receipts and generated PDF reports will reflect these values.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Settings;

