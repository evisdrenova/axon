import { ServerConfig } from "src/types";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import Spinner from "../../components/ui/Spinner";
import { Circle, Pencil, Trash } from "lucide-react";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { Switch } from "../../components/ui/switch";

interface ServerTableProps {
  servers: ServerConfig[];
  handleDelete: (e: React.MouseEvent, pId: number) => void;
  handleEdit: (server: ServerConfig) => void;
  isDeleting: boolean;
}

export default function ServerTable(props: ServerTableProps) {
  const { servers, handleDelete, handleEdit, isDeleting } = props;

  console.log(servers);
  return (
    <div className="grid gap-4">
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead className="w-1/3">Name</TableHead>
            <TableHead className="w-1/3">Description</TableHead>
            <TableHead className="w-1/3">Enable/Disable</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servers.map((server) => (
            <TableRow key={server.id} className="text-xs">
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  <span className="hover:underline">{server.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(server)}
                  >
                    <ArrowTopRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-xs">{server.description}</TableCell>
              <TableCell>
                <div className="flex justify-center">
                  <Switch />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// <Button
//                     variant="outline"
//                     size="icon"
//                     onClick={(e) => handleDelete(e, server.id)}
//                   >
//                     {isDeleting ? <Spinner /> : <Trash className="h-4 w-4" />}
//                   </Button>
