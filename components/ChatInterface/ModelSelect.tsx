import { Provider } from "src/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Box, Plus } from "lucide-react";
import { Separator } from "../../components/ui/separator";

interface Props {
  handleProviderSelect: (providerId: string) => void;
  selectedProvider: string;
  providers: Provider[];
}
export default function ModelSelect(props: Props) {
  const { handleProviderSelect, selectedProvider, providers } = props;

  return (
    <div className="inline-flex flex-row items-center">
      <Box size={16} />
      <Select onValueChange={handleProviderSelect} value={selectedProvider}>
        <SelectTrigger className="border-0 shadow-none text-xs ring-0 focus:outline-none focus:ring-0 gap-2">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {providers.map((provider) => (
            <SelectItem
              key={provider.id}
              value={provider.id?.toString() || ""}
              className="text-xs"
            >
              {provider.model}
            </SelectItem>
          ))}
          <Separator className="my-1" />
          <SelectItem
            value="new-model"
            className="text-xs hover:bg-gray-100 transition-colors mt-1"
          >
            <span className="flex items-center gap-1.5">
              <Plus size={12} />
              New Model
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
