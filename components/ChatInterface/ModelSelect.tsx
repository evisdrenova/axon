import { Provider } from "src/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

interface Props {
  handleProviderSelect: (providerId: string) => void;
  selectedProvider: string;
  providers: Provider[];
}
export default function ModelSelect(props: Props) {
  const { handleProviderSelect, selectedProvider, providers } = props;

  return (
    <div className="inline-block">
      <Select onValueChange={handleProviderSelect} value={selectedProvider}>
        <SelectTrigger className="border-0 shadow-none text-xs ring-0 focus:outline-none focus:ring-0 gap-2">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {providers.map((provider) => (
            <SelectItem key={provider.id} value={provider.id?.toString() || ""}>
              {provider.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
