import { useState, useEffect } from "react";
import { Provider } from "../types";
import { Pencil, Trash } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Alert, AlertDescription } from "../../components/ui/alert";

export default function Providers() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  const loadProviders = async () => {
    try {
      const providers = await window.electron.getProviders();
      setProviders(providers);
    } catch (err) {
      setError("Failed to load providers");
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  if (providers.length === 0 && !showForm) {
    return (
      <div className="p-4">
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No providers created yet
            </p>
            <Button onClick={() => setShowForm(true)}>
              Create New Provider
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async (e: React.MouseEvent, pId: number) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      await window.electron.deleteProvider(pId);
      setProviders(providers.filter((provider) => provider.id !== pId));
    } catch (error) {
      setError("Failed to delete provider");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProvider(null);
    setError(null);
  };

  return (
    <div className="p-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Providers</h1>
        {!showForm && (
          <Button
            onClick={() => {
              setEditingProvider(null);
              setShowForm(true);
            }}
          >
            New Provider
          </Button>
        )}
      </div>

      {showForm ? (
        <ProviderForm
          onSave={loadProviders}
          onCancel={handleCloseForm}
          initialData={editingProvider}
        />
      ) : (
        <div className="grid gap-4">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardContent className="flex justify-between items-center pt-6">
                <div>
                  <h3 className="font-bold">{provider.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {provider.baseUrl}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Model: {provider.model}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(provider)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => handleDelete(e, provider.id)}
                    disabled={isDeleting}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
interface ProviderProps {
  onSave: () => void;
  onCancel: () => void;
  initialData?: Provider | null;
}

const PROVIDER_TYPES = [
  {
    value: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiPath: "/chat/completions",
    defaultModel: "gpt-3.5-turbo",
  },
  {
    value: "anthropic",
    label: "Anthropic",
    baseUrl: "https://api.anthropic.com",
    apiPath: "/v1/messages",
    defaultModel: "claude-3-opus-20240229",
  },
  {
    value: "local",
    label: "Local",
    baseUrl: "http://localhost",
    apiPath: "/v1/chat/completions",
    defaultModel: "",
  },
];

function ProviderForm(props: ProviderProps) {
  const { onSave, onCancel, initialData } = props;
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Provider>(() => {
    if (initialData) {
      return { ...initialData };
    }
    return {
      name: "",
      type: "",
      baseUrl: "",
      apiPath: "",
      apiKey: "",
      model: "",
      config: "",
    };
  });

  const handleProviderTypeChange = (type: string) => {
    const selectedProvider = PROVIDER_TYPES.find((p) => p.value === type);
    if (selectedProvider) {
      setFormData((prev) => ({
        ...prev,
        type,
        name: prev.name || `${selectedProvider.label} Provider`,
        baseUrl: selectedProvider.baseUrl,
        apiPath: selectedProvider.apiPath,
        model: selectedProvider.defaultModel,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (initialData) {
        await window.electron.updateProvider(formData);
      } else {
        await window.electron.addProvider(formData);
      }
      onSave();
      onCancel();
    } catch (err) {
      setError(
        initialData ? "Failed to update provider" : "Failed to create provider"
      );
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Provider" : "New Provider"}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={handleProviderTypeChange}
              disabled={!!initialData}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider type" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              type="url"
              value={formData.baseUrl}
              onChange={(e) =>
                setFormData({ ...formData, baseUrl: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiPath">API Path</Label>
            <Input
              id="apiPath"
              value={formData.apiPath}
              onChange={(e) =>
                setFormData({ ...formData, apiPath: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={formData.apiKey}
              onChange={(e) =>
                setFormData({ ...formData, apiKey: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) =>
                setFormData({ ...formData, model: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="config">Additional Config (optional)</Label>
            <Input
              id="config"
              value={formData.config}
              onChange={(e) =>
                setFormData({ ...formData, config: e.target.value })
              }
              placeholder="JSON configuration string"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? "Update Provider" : "Save Provider"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
