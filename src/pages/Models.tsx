import { useState, useEffect } from "react";
import { Provider } from "../types";
import { Box } from "lucide-react";
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
import ModelTable from "../../components/Tables/ModelTable";
import ButtonText from "../../src/lib/ButtonText";
import Spinner from "../../src/lib/Spinner";
import { toast } from "sonner";

interface Props {
  loadProviders: () => void;
}

export default function Models(props: Props) {
  const { loadProviders } = props;
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  if (providers.length === 0 && !showForm) {
    return (
      <div className="p-4 border-2 border-main-200 m-4 rounded-lg border-dashed">
        <div className="flex flex-col gap-2 items-center py-8">
          <Box size={20} className="text-primary" />
          <p className="text-foreground mb-4">No Models added yet</p>
          <Button onClick={() => setShowForm(true)}>+ Add New Model</Button>
        </div>
      </div>
    );
  }

  const handleDelete = async (pId: number) => {
    setIsDeleting(true);
    try {
      await window.electron.deleteProvider(pId);
      setProviders(providers.filter((provider) => provider.id !== pId));
    } catch (err) {
      toast.error("Failed to delete provider", err);
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
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        {!showForm && (
          <Button
            onClick={() => {
              setEditingProvider(null);
              setShowForm(true);
            }}
          >
            + New Server
          </Button>
        )}
      </div>

      {showForm ? (
        <ModelForm
          onSave={loadProviders}
          onCancel={handleCloseForm}
          initialData={editingProvider}
          isDeleting={isDeleting}
          handleDelete={handleDelete}
        />
      ) : (
        <ModelTable models={providers} handleEdit={handleEdit} />
      )}
    </div>
  );
}

interface ProviderProps {
  onSave: () => void;
  onCancel: () => void;
  initialData?: Provider | null;
  isDeleting: boolean;
  handleDelete: (val: number) => void;
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

function ModelForm(props: ProviderProps) {
  const { onSave, onCancel, initialData, isDeleting, handleDelete } = props;

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
      toast.error(
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-end ">
            {initialData && ( // Only show delete button when editing
              <Button
                type="button"
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault();
                  if (initialData.id) {
                    handleDelete(initialData.id);
                    onCancel(); // Close the form after deletion
                  }
                }}
              >
                <ButtonText
                  leftIcon={
                    isDeleting ? (
                      <Spinner className="text-black dark:text-white" />
                    ) : (
                      <div />
                    )
                  }
                  text="Delete Server"
                />
              </Button>
            )}
          </div>
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
