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
    <Select onValueChange={handleProviderSelect} value={selectedProvider}>
      <SelectTrigger>
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
  );
}
