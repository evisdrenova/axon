import { useState, useEffect } from "react";
import { Provider } from "../types";

export default function Providers() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showForm, setShowForm] = useState(false);

  const loadProviders = async () => {
    const providers = await window.electron.getProviders();
    setProviders(providers);
  };

  useEffect(() => {
    loadProviders();
  }, []);

  if (providers.length === 0 && !showForm) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No providers created yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create New Provider
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Providers</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          New Provider
        </button>
      </div>

      {showForm && (
        <ProviderForm
          onSave={loadProviders}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="grid gap-4">
        {providers.map((provider) => (
          <div key={provider.id} className="bg-white p-4 rounded shadow">
            <h3 className="font-bold">{provider.name}</h3>

            <p className="text-sm text-gray-500">{provider.base_url}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProviderProps {
  onSave: () => void;
  onCancel: () => void;
}

function ProviderForm(props: ProviderProps) {
  const { onSave, onCancel } = props;

  const [formData, setFormData] = useState<Provider>({
    name: "",
    base_url: "",
    api_key: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await window.electron.addProvider(formData);
    onSave();
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4">
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Base URL</label>
          <input
            type="url"
            value={formData.base_url}
            onChange={(e) =>
              setFormData({ ...formData, base_url: e.target.value })
            }
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">API Key</label>
          <input
            type="password"
            value={formData.api_key}
            onChange={(e) =>
              setFormData({ ...formData, api_key: e.target.value })
            }
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save Provider
          </button>
        </div>
      </div>
    </form>
  );
}
